import { Wifi, WifiOff } from 'lucide-react';
import { ConnectionStatus as Status } from '@/hooks/useConnectionHealth';

interface ConnectionStatusProps {
  status: Status;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  className?: string;
}

/**
 * Visual indicator for connection health status
 * - Green dot + "Online" for connected
 * - Red dot + "Offline" for disconnected
 * - Yellow dot + "Reconnecting..." for retry in progress
 */
export function ConnectionStatus({
  status,
  lastConnected,
  lastDisconnected,
  className = '',
}: ConnectionStatusProps) {
  // Determine status color and text
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          dotColor: 'bg-green-500',
          textColor: 'text-green-700',
          icon: <Wifi className="w-3 h-3" />,
          text: 'Online',
        };
      case 'offline':
        return {
          dotColor: 'bg-red-500',
          textColor: 'text-red-700',
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Offline',
        };
      case 'reconnecting':
        return {
          dotColor: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          icon: <Wifi className="w-3 h-3 animate-pulse" />,
          text: 'Reconnecting...',
        };
    }
  };

  const config = getStatusConfig();

  // Format last connection time
  const getLastConnectionText = () => {
    if (status === 'online' && lastConnected) {
      const diff = Date.now() - lastConnected.getTime();
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      return lastConnected.toLocaleTimeString();
    }
    if (status === 'offline' && lastDisconnected) {
      return `Disconnected at ${lastDisconnected.toLocaleTimeString()}`;
    }
    return null;
  };

  const lastConnectionText = getLastConnectionText();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status icon */}
      <div className={config.textColor}>{config.icon}</div>

      {/* Pulsing status dot */}
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full ${config.dotColor} ${
            status === 'reconnecting' ? 'animate-pulse' : ''
          }`}
        />
        {status === 'online' && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>

      {/* Status text */}
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.text}
        </span>
        {lastConnectionText && (
          <span className="text-[10px] text-muted-foreground">
            {lastConnectionText}
          </span>
        )}
      </div>
    </div>
  );
}
