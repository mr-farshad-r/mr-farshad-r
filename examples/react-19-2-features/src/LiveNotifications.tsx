import { useEffect, useEffectEvent, useMemo, useState } from "react";

export type Theme = "cyan" | "violet" | "coral";

type Notification = {
  id: string;
  message: string;
  theme: Theme;
  receivedAt: string;
};

type Props = {
  channel: string;
  theme: Theme;
};

const updates = [
  "React 19.2 build completed",
  "Performance trace uploaded",
  "Preview deployment is ready",
  "All component checks passed",
];

function connectToFeed(
  channel: string,
  onMessage: (message: string) => void,
) {
  let updateIndex = 0;
  console.info(`Connected to ${channel}`);

  const timer = window.setInterval(() => {
    onMessage(updates[updateIndex % updates.length]);
    updateIndex += 1;
  }, 3000);

  return () => {
    window.clearInterval(timer);
    console.info(`Disconnected from ${channel}`);
  };
}

export function LiveNotifications({ channel, theme }: Props) {
  const [filter, setFilter] = useState("");
  const [messages, setMessages] = useState<Notification[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);

  const onMessage = useEffectEvent((message: string) => {
    setMessages((current) => [
      {
        id: crypto.randomUUID(),
        message,
        theme,
        receivedAt: new Date().toLocaleTimeString(),
      },
      ...current,
    ]);
  });

  useEffect(() => {
    setConnectionCount((count) => count + 1);
    return connectToFeed(channel, onMessage);
  }, [channel]);

  const visibleMessages = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return query
      ? messages.filter(({ message }) => message.toLowerCase().includes(query))
      : messages;
  }, [filter, messages]);

  return (
    <section className="feed" aria-labelledby="feed-title">
      <div className="feed-toolbar">
        <div>
          <span className="status-dot" aria-hidden="true" />
          <span>Connected to {channel}</span>
          <small>Connection #{connectionCount}</small>
        </div>

        <label>
          <span className="sr-only">Filter notifications</span>
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter notifications…"
          />
        </label>
      </div>

      <div className="feed-heading">
        <h2 id="feed-title">Recent activity</h2>
        <span>{visibleMessages.length} events</span>
      </div>

      {visibleMessages.length === 0 ? (
        <p className="empty-state">
          {messages.length === 0
            ? "Waiting for the first simulated event…"
            : "No events match this filter."}
        </p>
      ) : (
        <ol className="notifications">
          {visibleMessages.map((notification) => (
            <li key={notification.id}>
              <span className={`event-icon event-${notification.theme}`} />
              <div>
                <strong>{notification.message}</strong>
                <span>
                  Received with the {notification.theme} theme at {notification.receivedAt}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
