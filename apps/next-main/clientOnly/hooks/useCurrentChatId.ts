import { usePathname } from "next/navigation";

export function useCurrentChatId() {
  // Get the current chat id from the url
  const pathName = usePathname();

  // `/app/chat/${c.id}` parse out the id
  // Match regex
  const match = pathName?.match(/\/app\/chat\/(.*)/);
  if (!match) return null;

  return match[1];
}
