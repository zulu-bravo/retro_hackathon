"use client";

import { useEffect, useState, useTransition } from "react";

interface UserOption {
  id: string;
  name: string;
  teamName: string;
}

export function ActingAsDropdown() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: UserOption[]) => {
        setUsers(data);
        // Read current cookie
        const match = document.cookie.match(
          /(?:^|; )acting_as_user_id=([^;]*)/
        );
        if (match) {
          setSelected(match[1]);
        } else if (data.length > 0) {
          // Default to first user
          setSelected(data[0].id);
          document.cookie = `acting_as_user_id=${data[0].id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
        }
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const userId = e.target.value;
    setSelected(userId);
    document.cookie = `acting_as_user_id=${userId}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    startTransition(() => {
      window.location.reload();
    });
  }

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="acting-as" className="opacity-80">
        Acting as:
      </label>
      <select
        id="acting-as"
        value={selected}
        onChange={handleChange}
        className="bg-indigo-600 text-white border border-indigo-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.teamName})
          </option>
        ))}
      </select>
    </div>
  );
}
