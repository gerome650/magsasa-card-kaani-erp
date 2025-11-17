# Connection Health Monitoring

## Overview

The KaAni chat interface includes a persistent connection status indicator that monitors both browser connectivity and SSE (Server-Sent Events) connection health. This provides real-time feedback to users about their connection state.

## Features

### Visual Status Indicators

The connection status indicator displays three distinct states:

1. **Online** (Green)
   - Green pulsing dot with Wifi icon
   - Text: "Online"
   - Shows when browser is online and SSE connection is active
   - Displays last connection timestamp

2. **Offline** (Red)
   - Red dot with WifiOff icon
   - Text: "Offline"
   - Shows when browser loses internet connection
   - Displays disconnection timestamp

3. **Reconnecting** (Yellow)
   - Yellow pulsing dot with animated Wifi icon
   - Text: "Reconnecting..."
   - Shows during automatic retry attempts
   - Indicates system is attempting to restore connection

## Implementation

### Components

#### useConnectionHealth Hook
Location: `client/src/hooks/useConnectionHealth.ts`

Monitors connection health through browser online/offline events, SSE connection state tracking, and connection timestamps.

#### ConnectionStatus Component
Location: `client/src/components/ConnectionStatus.tsx`

Visual indicator component that displays status icon, colored status dot with animations, status text, and last connection/disconnection time.

### Integration with KaAniChat

The connection monitoring is integrated at three key points:
1. On Data Received - marks SSE as connected
2. On Retry Attempt - sets reconnecting state
3. On Error - marks SSE as disconnected

### UI Placement

The connection status indicator is positioned in the KaAni chat header between the conversation manager and the sample formats dialog.

## User Experience

- **Normal Operation**: Green "Online" status with pulsing animation
- **Network Interruption**: Red "Offline" status with disconnection timestamp
- **Automatic Recovery**: Yellow "Reconnecting..." during retry, returns to green when restored

## Testing Scenarios

1. Online Status - Verify green indicator with active connection
2. Offline Status - Disable network and verify red indicator
3. Reconnection - Test automatic reconnection with yellow indicator
4. SSE Connection Tracking - Verify indicator updates based on SSE responses

## Technical Notes

- Uses standard browser APIs (navigator.onLine, window events)
- Local state management (no global state required)
- Lightweight CSS animations
- Accessible (icons + text, not color-only)

## Future Enhancements

- Connection quality metrics (latency, signal strength)
- Offline mode with message queuing
- Advanced diagnostics and connection history
- User preferences for indicator customization
