import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Farm management routers
  farms: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getFarmsByUserId(ctx.user.id, input);
      }),
    
    getById: publicProcedure  // Temporarily public for testing
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getFarmById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        farmerName: z.string(),
        barangay: z.string(),
        municipality: z.string(),
        latitude: z.string(),
        longitude: z.string(),
        size: z.number(),
        crops: z.array(z.string()),
        soilType: z.string().optional(),
        irrigationType: z.enum(["Irrigated", "Rainfed", "Upland"]).optional(),
        averageYield: z.number().optional(),
        status: z.enum(["active", "inactive", "fallow"]).optional(),
        photoUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const farmId = await db.createFarm({
          ...input,
          userId: ctx.user.id,
        });
        return { farmId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        farmerName: z.string().optional(),
        barangay: z.string().optional(),
        municipality: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        size: z.number().optional(),
        crops: z.array(z.string()).optional(),
        soilType: z.string().optional(),
        irrigationType: z.enum(["Irrigated", "Rainfed", "Upland"]).optional(),
        averageYield: z.number().optional(),
        status: z.enum(["active", "inactive", "fallow"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFarm(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFarm(input.id);
        return { success: true };
      }),
    
    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const results = {
          success: [] as number[],
          failed: [] as { id: number; error: string }[],
        };
        
        for (const id of input.ids) {
          try {
            await db.deleteFarm(id);
            results.success.push(id);
          } catch (error) {
            results.failed.push({
              id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        
        return results;
      }),
    
    uploadPhoto: protectedProcedure
      .input(z.object({
        farmId: z.number().optional(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 to buffer
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Generate unique filename
        const timestamp = Date.now();
        const farmPrefix = input.farmId ? `farm-${input.farmId}` : 'temp';
        const extension = input.fileName.split('.').pop() || 'jpg';
        const uniqueFileName = `${farmPrefix}-${timestamp}.${extension}`;
        const s3Key = `farms/photos/${uniqueFileName}`;
        
        // Upload to S3
        const { url } = await storagePut(s3Key, buffer, input.contentType);
        
        return { url, key: s3Key };
      }),
  }),
  
  boundaries: router({
    getByFarmId: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBoundariesByFarmId(input.farmId);
      }),
    
    save: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        boundaries: z.array(z.object({
        parcelIndex: z.number(),
        geoJson: z.string(),
        area: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.saveBoundaries(input.farmId, input.boundaries);
        return { success: true };
      }),
  }),
  
  yields: router({
    getByFarmId: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await db.getYieldsByFarmId(input.farmId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        parcelIndex: z.number(),
        cropType: z.string(),
        harvestDate: z.string(),
        quantity: z.number(),
        unit: z.enum(["kg", "tons"]),
        qualityGrade: z.enum(["Premium", "Standard", "Below Standard"]),
      }))
      .mutation(async ({ input }) => {
        const yieldId = await db.createYield(input);
        return { yieldId };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteYield(input.id);
        return { success: true };
      }),
  }),
  
  costs: router({
    getByFarmId: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCostsByFarmId(input.farmId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        date: z.string(),
        category: z.enum(["Fertilizer", "Pesticides", "Seeds", "Labor", "Equipment", "Other"]),
        description: z.string().optional(),
        amount: z.number(),
        parcelIndex: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        const costId = await db.createCost(input);
        return { costId };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCost(input.id);
        return { success: true };
      }),
  }),

  // KaAni AI Chat router
  kaani: router({
    sendMessage: protectedProcedure
      .input(z.object({
        message: z.string(),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
        if (!apiKey) {
          throw new Error("Google AI Studio API key not configured");
        }

        // Initialize Gemini API
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Build conversation context for Gemini
        const systemPrompt = `You are KaAni, an AI assistant for Filipino farmers using the MAGSASA-CARD platform. You help with:
- Rice farming advice (pagtatanim ng palay)
- CARD MRI loan information and AgScore™ system
- Pest control recommendations
- Market prices and harvest tracking
- Weather information
- General agricultural guidance

Respond in Filipino (Tagalog) when the user asks in Filipino, and in English when they ask in English. Be helpful, friendly, and provide practical agricultural advice.`;

        // Build chat history
        const history = input.conversationHistory?.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })) || [];

        // Start chat with history
        const chat = model.startChat({
          history,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        });

        // Send message with system context
        const fullMessage = history.length === 0 
          ? `${systemPrompt}\n\nUser: ${input.message}` 
          : input.message;
        
        const result = await chat.sendMessage(fullMessage);
        const response = result.response.text();

        // Categorize the message
        const lowerMessage = input.message.toLowerCase();
        let category = "general";
        if (lowerMessage.includes("palay") || lowerMessage.includes("rice") || lowerMessage.includes("tanim")) {
          category = "rice_farming";
        } else if (lowerMessage.includes("loan") || lowerMessage.includes("pautang") || lowerMessage.includes("utang")) {
          category = "loan";
        } else if (lowerMessage.includes("agscore") || lowerMessage.includes("score")) {
          category = "agscore";
        } else if (lowerMessage.includes("peste") || lowerMessage.includes("pest")) {
          category = "pest_control";
        } else if (lowerMessage.includes("presyo") || lowerMessage.includes("price") || lowerMessage.includes("market")) {
          category = "market_prices";
        } else if (lowerMessage.includes("weather") || lowerMessage.includes("panahon")) {
          category = "weather";
        }

        // Note: Chat messages are now saved per conversation
        // This endpoint is deprecated in favor of conversation-based chat

        return { response, category };
      }),

    getHistory: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getChatMessagesByUserId(ctx.user.id, input.limit);
      }),

    clearHistory: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.deleteChatMessagesByUserId(ctx.user.id);
        return { success: true };
      }),

    // Streaming version using subscription (for real-time word-by-word)
    sendMessageStream: protectedProcedure
      .input(z.object({
        message: z.string(),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
        if (!apiKey) {
          throw new Error("Google AI Studio API key not configured");
        }

        // Initialize Gemini API
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Build conversation context for Gemini
        const systemPrompt = `You are KaAni, an AI assistant for Filipino farmers using the MAGSASA-CARD platform. You help with:
- Rice farming advice (pagtatanim ng palay)
- CARD MRI loan information and AgScore™ system
- Pest control recommendations
- Market prices and harvest tracking
- Weather information
- General agricultural guidance

Respond in Filipino (Tagalog) when the user asks in Filipino, and in English when they ask in English. Be helpful, friendly, and provide practical agricultural advice.`;

        // Build chat history
        const history = input.conversationHistory?.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })) || [];

        // Start chat with history
        const chat = model.startChat({
          history,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        });

        // Send message with system context and stream response
        const fullMessage = history.length === 0 
          ? `${systemPrompt}\n\nUser: ${input.message}` 
          : input.message;
        
        const streamResult = await chat.sendMessageStream(fullMessage);
        
        // Collect full response for database storage
        let fullResponse = "";
        const chunks: string[] = [];
        
        for await (const chunk of streamResult.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          chunks.push(chunkText);
        }

        // Categorize the message
        const lowerMessage = input.message.toLowerCase();
        let category = "general";
        if (lowerMessage.includes("palay") || lowerMessage.includes("rice") || lowerMessage.includes("tanim")) {
          category = "rice_farming";
        } else if (lowerMessage.includes("loan") || lowerMessage.includes("pautang") || lowerMessage.includes("utang")) {
          category = "loan";
        } else if (lowerMessage.includes("agscore") || lowerMessage.includes("score")) {
          category = "agscore";
        } else if (lowerMessage.includes("peste") || lowerMessage.includes("pest")) {
          category = "pest_control";
        } else if (lowerMessage.includes("presyo") || lowerMessage.includes("price") || lowerMessage.includes("market")) {
          category = "market_prices";
        } else if (lowerMessage.includes("weather") || lowerMessage.includes("panahon")) {
          category = "weather";
        }

        // Note: Chat messages are now saved per conversation
        // This endpoint is deprecated in favor of conversation-based chat

        // Return chunks for frontend streaming simulation
        return { response: fullResponse, chunks, category };
      }),

    // True real-time SSE streaming using tRPC subscriptions
    sendMessageStreamSSE: protectedProcedure
      .input(z.object({
        message: z.string(),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .subscription(async ({ ctx, input }) => {
        const { observable } = await import('@trpc/server/observable');
        
        return observable<{ type: 'chunk' | 'done' | 'error'; content: string; category?: string }>((emit) => {
          (async () => {
            try {
              const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
              if (!apiKey) {
                emit.error(new Error("Google AI Studio API key not configured"));
                return;
              }

              // Initialize Gemini API
              const genAI = new GoogleGenerativeAI(apiKey);
              const model = genAI.getGenerativeModel({ model: "gemini-pro" });

              // Build conversation context for Gemini
              const systemPrompt = `You are KaAni, an AI assistant for Filipino farmers using the MAGSASA-CARD platform. You help with:
- Rice farming advice (pagtatanim ng palay)
- CARD MRI loan information and AgScore™ system
- Pest control recommendations
- Market prices and harvest tracking
- Weather information
- General agricultural guidance

Respond in Filipino (Tagalog) when the user asks in Filipino, and in English when they ask in English. Be helpful, friendly, and provide practical agricultural advice.`;

              // Build chat history
              const history = input.conversationHistory?.map(msg => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
              })) || [];

              // Start chat with history
              const chat = model.startChat({
                history,
                generationConfig: {
                  maxOutputTokens: 1000,
                  temperature: 0.7,
                },
              });

              // Send message with system context and stream response
              const fullMessage = history.length === 0 
                ? `${systemPrompt}\n\nUser: ${input.message}` 
                : input.message;
              
              const streamResult = await chat.sendMessageStream(fullMessage);
              
              // Stream chunks in real-time as they arrive
              let fullResponse = "";
              
              for await (const chunk of streamResult.stream) {
                const chunkText = chunk.text();
                fullResponse += chunkText;
                
                // Emit each chunk immediately
                emit.next({ type: 'chunk', content: chunkText });
              }

              // Categorize the message
              const lowerMessage = input.message.toLowerCase();
              let category = "general";
              if (lowerMessage.includes("palay") || lowerMessage.includes("rice") || lowerMessage.includes("tanim")) {
                category = "rice_farming";
              } else if (lowerMessage.includes("loan") || lowerMessage.includes("pautang") || lowerMessage.includes("utang")) {
                category = "loan";
              } else if (lowerMessage.includes("agscore") || lowerMessage.includes("score")) {
                category = "agscore";
              } else if (lowerMessage.includes("peste") || lowerMessage.includes("pest")) {
                category = "pest_control";
              } else if (lowerMessage.includes("presyo") || lowerMessage.includes("price") || lowerMessage.includes("market")) {
                category = "market_prices";
              } else if (lowerMessage.includes("weather") || lowerMessage.includes("panahon")) {
                category = "weather";
              }

              // Note: Chat messages are now saved per conversation
              // This SSE endpoint will be updated to use conversationId

              // Signal completion
              emit.next({ type: 'done', content: fullResponse, category });
              emit.complete();
            } catch (error) {
              console.error('[KaAni SSE] Error:', error);
              emit.error(error instanceof Error ? error : new Error('Unknown error occurred'));
            }
          })();

          // Cleanup function
          return () => {
            // No cleanup needed for Gemini API
          };
        });
      }),
  }),

  // Analytics router for visual dashboard
  analytics: router({
    // Harvest trends by region (municipality) over time
    harvestTrendsByRegion: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        region: z.enum(["all", "bacolod", "laguna"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getHarvestTrendsByRegion(input);
      }),

    // Crop performance comparison (yield, harvest, revenue)
    cropPerformance: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        region: z.enum(["all", "bacolod", "laguna"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getCropPerformance(input);
      }),

    // Cost analysis by category and ROI by crop
    costAnalysis: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        region: z.enum(["all", "bacolod", "laguna"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getCostAnalysis(input);
      }),

    // Regional comparison (Bacolod vs Laguna)
    regionalComparison: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getRegionalComparison(input);
      }),
  }),

  // Conversations management router
  conversations: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getConversationsByUserId(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversationId = await db.createConversation({
          userId: ctx.user.id,
          title: input.title,
        });
        return { conversationId };
      }),

    updateTitle: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateConversationTitle(input.id, input.title);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteConversation(input.id);
        return { success: true };
      }),

    getMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getChatMessagesByConversationId(input.conversationId);
      }),

    search: protectedProcedure
      .input(z.object({
        query: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.searchConversations(ctx.user.id, input.query);
      }),

    addMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        const messageId = await db.addChatMessage({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
        });
        return { messageId };
      }),
  }),

  // Batch Orders router for Agri Input procurement
  batchOrder: router({
    create: protectedProcedure
      .input(z.object({
        referenceCode: z.string().optional(),
        supplierId: z.string().nullable().optional(),
        inputType: z.enum(["fertilizer", "seed", "feed", "pesticide", "other"]).optional(),
        expectedDeliveryDate: z.string(), // ISO date
        deliveryWindowStart: z.string().optional().nullable(),
        deliveryWindowEnd: z.string().optional().nullable(),
        currency: z.literal("PHP").default("PHP"),
        pricingMode: z.literal("margin").default("margin"),
        items: z.array(
          z.object({
            farmId: z.number(),
            farmerId: z.number().nullable().optional(),
            productId: z.string().nullable().optional(),
            inputType: z.enum(["fertilizer", "seed", "feed", "pesticide", "other"]).optional(),
            quantityOrdered: z.number().positive(),
            unit: z.string().min(1),
            supplierUnitPrice: z.number().min(0),
            farmerUnitPrice: z.number().min(0),
            notes: z.string().optional().nullable(),
          })
        ).min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validation: expectedDeliveryDate must be >= today (or within 2 days tolerance)
        const deliveryDate = new Date(input.expectedDeliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        if (deliveryDate < twoDaysAgo) {
          throw new Error("Expected delivery date cannot be more than 2 days in the past");
        }

        // Validate all farms exist
        const farmIds = input.items.map(item => item.farmId);
        const uniqueFarmIds = [...new Set(farmIds)];
        for (const farmId of uniqueFarmIds) {
          const farm = await db.getFarmById(farmId);
          if (!farm) {
            throw new Error(`Farm with ID ${farmId} does not exist`);
          }
        }

        // Generate reference code if not provided
        const referenceCode = input.referenceCode || (() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          return `BATCH-${year}${month}${day}-${random}`;
        })();

        // Compute totals
        let totalQuantity = 0;
        let totalSupplierTotal = 0;
        let totalFarmerTotal = 0;
        let totalAgsenseRevenue = 0;

        const processedItems = input.items.map(item => {
          const marginPerUnit = item.farmerUnitPrice - item.supplierUnitPrice;
          const lineSupplierTotal = item.quantityOrdered * item.supplierUnitPrice;
          const lineFarmerTotal = item.quantityOrdered * item.farmerUnitPrice;
          const lineAgsenseRevenue = item.quantityOrdered * marginPerUnit;

          totalQuantity += item.quantityOrdered;
          totalSupplierTotal += lineSupplierTotal;
          totalFarmerTotal += lineFarmerTotal;
          totalAgsenseRevenue += lineAgsenseRevenue;

          return {
            id: crypto.randomUUID(),
            batchOrderId: '', // Will be set below
            farmId: item.farmId,
            farmerId: item.farmerId || null,
            productId: item.productId || null,
            inputType: item.inputType || null,
            quantityOrdered: item.quantityOrdered.toString(),
            unit: item.unit,
            supplierUnitPrice: item.supplierUnitPrice.toString(),
            farmerUnitPrice: item.farmerUnitPrice.toString(),
            marginPerUnit: marginPerUnit.toString(),
            lineSupplierTotal: lineSupplierTotal.toString(),
            lineFarmerTotal: lineFarmerTotal.toString(),
            lineAgsenseRevenue: lineAgsenseRevenue.toString(),
            notes: item.notes || null,
          };
        });

        const batchOrderId = crypto.randomUUID();
        
        // Set batchOrderId for all items
        processedItems.forEach(item => {
          item.batchOrderId = batchOrderId;
        });

        const batchOrder = {
          id: batchOrderId,
          referenceCode,
          status: "draft" as const,
          supplierId: input.supplierId || null,
          inputType: input.inputType || null,
          pricingMode: "margin" as const,
          currency: "PHP",
          expectedDeliveryDate: input.expectedDeliveryDate,
          deliveryWindowStart: input.deliveryWindowStart ? new Date(input.deliveryWindowStart) : null,
          deliveryWindowEnd: input.deliveryWindowEnd ? new Date(input.deliveryWindowEnd) : null,
          totalQuantity: totalQuantity.toString(),
          totalSupplierTotal: totalSupplierTotal.toString(),
          totalFarmerTotal: totalFarmerTotal.toString(),
          totalAgsenseRevenue: totalAgsenseRevenue.toString(),
          createdByUserId: ctx.user.id,
          approvedByUserId: null,
        };

        await db.createBatchOrder(batchOrder, processedItems);

        return await db.getBatchOrderById(batchOrderId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["draft", "pending_approval"]).optional(),
        supplierId: z.string().nullable().optional(),
        inputType: z.enum(["fertilizer", "seed", "feed", "pesticide", "other"]).optional(),
        expectedDeliveryDate: z.string().optional(),
        deliveryWindowStart: z.string().optional().nullable(),
        deliveryWindowEnd: z.string().optional().nullable(),
        currency: z.literal("PHP").optional(),
        items: z.array(
          z.object({
            id: z.string().optional(),
            farmId: z.number(),
            farmerId: z.number().nullable().optional(),
            productId: z.string().nullable().optional(),
            inputType: z.enum(["fertilizer", "seed", "feed", "pesticide", "other"]).optional(),
            quantityOrdered: z.number().positive(),
            unit: z.string().min(1),
            supplierUnitPrice: z.number().min(0),
            farmerUnitPrice: z.number().min(0),
            notes: z.string().optional().nullable(),
          })
        ).min(1),
      }))
      .mutation(async ({ input }) => {
        // Get existing order
        const existingOrder = await db.getBatchOrderById(input.id);
        if (!existingOrder) {
          throw new Error("Batch order not found");
        }

        // Only allow updates if status is draft or pending_approval
        if (existingOrder.status !== "draft" && existingOrder.status !== "pending_approval") {
          throw new Error(`Cannot update batch order with status: ${existingOrder.status}`);
        }

        // Validate delivery date if provided
        if (input.expectedDeliveryDate) {
          const deliveryDate = new Date(input.expectedDeliveryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const twoDaysAgo = new Date(today);
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
          
          if (deliveryDate < twoDaysAgo) {
            throw new Error("Expected delivery date cannot be more than 2 days in the past");
          }
        }

        // Validate all farms exist
        const farmIds = input.items.map(item => item.farmId);
        const uniqueFarmIds = [...new Set(farmIds)];
        for (const farmId of uniqueFarmIds) {
          const farm = await db.getFarmById(farmId);
          if (!farm) {
            throw new Error(`Farm with ID ${farmId} does not exist`);
          }
        }

        // Compute totals
        let totalQuantity = 0;
        let totalSupplierTotal = 0;
        let totalFarmerTotal = 0;
        let totalAgsenseRevenue = 0;

        const processedItems = input.items.map(item => {
          const marginPerUnit = item.farmerUnitPrice - item.supplierUnitPrice;
          const lineSupplierTotal = item.quantityOrdered * item.supplierUnitPrice;
          const lineFarmerTotal = item.quantityOrdered * item.farmerUnitPrice;
          const lineAgsenseRevenue = item.quantityOrdered * marginPerUnit;

          totalQuantity += item.quantityOrdered;
          totalSupplierTotal += lineSupplierTotal;
          totalFarmerTotal += lineFarmerTotal;
          totalAgsenseRevenue += lineAgsenseRevenue;

          return {
            id: item.id || crypto.randomUUID(),
            batchOrderId: input.id,
            farmId: item.farmId,
            farmerId: item.farmerId || null,
            productId: item.productId || null,
            inputType: item.inputType || null,
            quantityOrdered: item.quantityOrdered.toString(),
            unit: item.unit,
            supplierUnitPrice: item.supplierUnitPrice.toString(),
            farmerUnitPrice: item.farmerUnitPrice.toString(),
            marginPerUnit: marginPerUnit.toString(),
            lineSupplierTotal: lineSupplierTotal.toString(),
            lineFarmerTotal: lineFarmerTotal.toString(),
            lineAgsenseRevenue: lineAgsenseRevenue.toString(),
            notes: item.notes || null,
          };
        });

        const updateData: any = {
          totalQuantity: totalQuantity.toString(),
          totalSupplierTotal: totalSupplierTotal.toString(),
          totalFarmerTotal: totalFarmerTotal.toString(),
          totalAgsenseRevenue: totalAgsenseRevenue.toString(),
        };

        if (input.status) updateData.status = input.status;
        if (input.supplierId !== undefined) updateData.supplierId = input.supplierId;
        if (input.inputType) updateData.inputType = input.inputType;
        if (input.expectedDeliveryDate) updateData.expectedDeliveryDate = input.expectedDeliveryDate;
        if (input.deliveryWindowStart !== undefined) {
          updateData.deliveryWindowStart = input.deliveryWindowStart ? new Date(input.deliveryWindowStart) : null;
        }
        if (input.deliveryWindowEnd !== undefined) {
          updateData.deliveryWindowEnd = input.deliveryWindowEnd ? new Date(input.deliveryWindowEnd) : null;
        }

        await db.updateBatchOrder(input.id, updateData, processedItems);

        return await db.getBatchOrderById(input.id);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const order = await db.getBatchOrderById(input.id);
        if (!order) {
          throw new Error("Batch order not found");
        }
        return order;
      }),

    list: protectedProcedure
      .input(z.object({
        status: z.array(z.enum(["draft", "pending_approval", "approved", "cancelled", "completed"])).optional(),
        supplierId: z.string().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const orders = await db.listBatchOrders(input);
        return { items: orders };
      }),
  }),
});

export type AppRouter = typeof appRouter;
