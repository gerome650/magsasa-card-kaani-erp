import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "../../drizzle/schema";

type User = InferSelectModel<typeof users>;
import * as db from "../db";
import { ENV } from "./env";
import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";
// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
  // Demo auth extensions (optional, only present for demo users)
  email?: string;
  // For demo users, role is the client role directly (farmer, field_officer, manager, supplier)
  // For production users, role is server role (user, admin)
  role?: "user" | "admin" | "farmer" | "field_officer" | "manager" | "supplier";
  loginMethod?: string;
};

const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
const GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;

class OAuthService {
  constructor(private client: ReturnType<typeof axios.create>) {
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    // Only log error in production; in dev mode, demo auth will be used
    if (!ENV.oAuthServerUrl && ENV.isProduction) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    } else if (!ENV.oAuthServerUrl) {
      console.log("[OAuth] OAUTH_SERVER_URL not set - demo auth fallback will be used");
    }
  }

  private decodeState(state: string): string {
    const redirectUri = atob(state);
    return redirectUri;
  }

  async getTokenByCode(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    const payload: ExchangeTokenRequest = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state),
    };

    const { data } = await this.client.post<ExchangeTokenResponse>(
      EXCHANGE_TOKEN_PATH,
      payload
    );

    return data;
  }

  async getUserInfoByToken(
    token: ExchangeTokenResponse
  ): Promise<GetUserInfoResponse> {
    const { data } = await this.client.post<GetUserInfoResponse>(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken,
      }
    );

    return data;
  }
}

const createOAuthHttpClient = (): AxiosInstance =>
  axios.create({
    baseURL: ENV.oAuthServerUrl,
    timeout: AXIOS_TIMEOUT_MS,
  });

class SDKServer {
  private readonly client: AxiosInstance;
  private readonly oauthService: OAuthService;

  constructor(client: AxiosInstance = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }

  private deriveLoginMethod(
    platforms: unknown,
    fallback: string | null | undefined
  ): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set<string>(
      platforms.filter((p): p is string => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (
      set.has("REGISTERED_PLATFORM_MICROSOFT") ||
      set.has("REGISTERED_PLATFORM_AZURE")
    )
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }

  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    return this.oauthService.getTokenByCode(code, state);
  }

  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken,
    } as ExchangeTokenResponse);
    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoResponse;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    const jwtPayload: Record<string, unknown> = {
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    };
    
    // Include demo auth extensions if present
    if (payload.email) jwtPayload.email = payload.email;
    if (payload.role) jwtPayload.role = payload.role;
    if (payload.loginMethod) jwtPayload.loginMethod = payload.loginMethod;

    return new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      // Only warn in production; in dev, demo auth fallback will handle it
      if (ENV.isProduction) {
        console.warn("[Auth] Missing session cookie");
      }
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name, email, role, loginMethod } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      // Validate role: can be server role (user/admin) or client role (farmer/field_officer/manager/supplier)
      const validRole = role && (
        role === "user" || role === "admin" ||
        role === "farmer" || role === "field_officer" || role === "manager" || role === "supplier"
      ) ? role as SessionPayload["role"] : undefined;

      return {
        openId,
        appId,
        name,
        ...(email && isNonEmptyString(email) ? { email } : {}),
        ...(validRole ? { role: validRole } : {}),
        ...(loginMethod && isNonEmptyString(loginMethod) ? { loginMethod } : {}),
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async getUserInfoWithJwt(
    jwtToken: string
  ): Promise<GetUserInfoWithJwtResponse> {
    const payload: GetUserInfoWithJwtRequest = {
      jwtToken,
      projectId: ENV.appId,
    };

    const { data } = await this.client.post<GetUserInfoWithJwtResponse>(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );

    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoWithJwtResponse;
  }

  async authenticateRequest(req: Request): Promise<User> {
    // Regular authentication flow
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date().toISOString();
    
    // DEMO AUTH FALLBACK: If session contains demo user data (email, role, loginMethod),
    // and database is unavailable, create User object from JWT payload
    const isDemoUser = session.email && session.role && session.loginMethod === "demo";
    const isDatabaseAvailable = !!ENV.databaseUrl;
    
    if (isDemoUser && !isDatabaseAvailable) {
      // Create User object from JWT payload (no DB required)
      const demoUser: User = {
        id: 0, // Placeholder ID for demo users
        openId: session.openId,
        name: session.name || null,
        email: session.email || null,
        loginMethod: session.loginMethod || "demo",
        role: session.role || "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSignedIn: signedInAt,
      };
      return demoUser;
    }

    // Try to get user from database (if available)
    let user: User | null = null;
    if (isDatabaseAvailable) {
      try {
        user = (await db.getUserByOpenId(sessionUserId)) || null;
      } catch (error) {
        // Database error - fall back to demo user if available
        if (isDemoUser) {
          const demoUser: User = {
            id: 0,
            openId: session.openId,
            name: session.name || null,
            email: session.email || null,
            loginMethod: session.loginMethod || "demo",
            role: session.role || "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSignedIn: signedInAt,
          };
          return demoUser;
        }
        throw error;
      }
    }

    // If user not in DB and we have OAuth server, sync from OAuth server automatically
    if (!user && isDatabaseAvailable && ENV.oAuthServerUrl) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt,
        });
        user = (await db.getUserByOpenId(userInfo.openId)) || null;
      } catch (error) {
        // OAuth sync failed - if demo user, return demo user object
        if (isDemoUser) {
          const demoUser: User = {
            id: 0,
            openId: session.openId,
            name: session.name || null,
            email: session.email || null,
            loginMethod: session.loginMethod || "demo",
            role: session.role || "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSignedIn: signedInAt,
          };
          return demoUser;
        }
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }

    // If still no user and not demo, throw error
    if (!user && !isDemoUser) {
      throw ForbiddenError("User not found");
    }

    // Update lastSignedIn if database is available
    if (user && isDatabaseAvailable) {
      try {
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: signedInAt,
        });
      } catch (error) {
        // Ignore DB errors for lastSignedIn update
      }
    }

    return user!;
  }
}

export const sdk = new SDKServer();
