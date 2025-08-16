import useSWR from "swr";
import { getUser } from "@/lib/users";


export function useUser(userId: string) {
  const { data, error, mutate } = useSWR(userId ? `/api/users/${userId}` : null, () =>
    getUser(userId)
  );

  return {
    user: data,
    loading: !data && !error,
    error,
    refresh: mutate,
  };
}
