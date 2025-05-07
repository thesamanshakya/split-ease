"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { User } from "@/types";
import Link from "next/link";
import Image from "next/image";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [email, setEmail] = useState("");
  const [searchName, setSearchName] = useState("");
  const [group, setGroup] = useState<{ id: string; name: string } | null>(null);
  const [currentMembers, setCurrentMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Get current user from our session API
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include", // Important: This ensures cookies are sent with the request
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch session:", response.status);
          router.push("/auth");
          return;
        }

        const sessionData = await response.json();

        if (!sessionData.isLoggedIn || !sessionData.user) {
          router.push("/auth");
          return;
        }

        // Get group details
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select("id, name")
          .eq("id", groupId)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        // Get current members
        const { data: groupMembersData, error: groupMembersError } =
          await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", groupId);

        if (groupMembersError) throw groupMembersError;

        if (groupMembersData && groupMembersData.length > 0) {
          const userIds = groupMembersData.map((member) => member.user_id);

          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name, email, avatar_url")
            .in("id", userIds);

          if (profilesError) throw profilesError;
          setCurrentMembers(profilesData || []);
        }
      } catch (error: any) {
        console.error("Error fetching group data:", error);
        setError(error.message || "An error occurred while loading the group");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if the email is already a member
      const existingMember = currentMembers.find(
        (member) => member.email.toLowerCase() === email.toLowerCase()
      );

      if (existingMember) {
        setError(`${email} is already a member of this group`);
        setInviting(false);
        return;
      }

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .single();

      if (userError) {
        if (userError.code === "PGRST116") {
          setError(
            `No user found with email ${email}. They need to sign up first.`
          );
        } else {
          throw userError;
        }
        setInviting(false);
        return;
      }

      // Add user to the group
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: userData.id,
        });

      if (memberError) throw memberError;

      setSuccess(`${email} has been added to the group!`);
      setEmail("");

      // Add the new member to the current members list
      const { data: newMemberData } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .eq("id", userData.id)
        .single();

      if (newMemberData) {
        setCurrentMembers([...currentMembers, newMemberData]);
      }
    } catch (error: any) {
      console.error("Error inviting member:", error);
      setError(error.message || "An error occurred while inviting the member");
    } finally {
      setInviting(false);
    }
  };

  const searchUsers = useCallback(async () => {
    setSearching(true);
    setError(null);

    try {
      if (!searchName.trim()) {
        setAvailableUsers([]);
        setSearching(false);
        return;
      }

      // Get current member IDs for filtering
      const currentMemberIds = currentMembers.map((member) => member.id);

      // Search for users by name
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .ilike("name", `%${searchName}%`)
        .limit(10);

      if (error) throw error;

      // Filter out users who are already members
      const filteredUsers =
        data?.filter((user) => !currentMemberIds.includes(user.id)) || [];
      setAvailableUsers(filteredUsers);
    } catch (error: any) {
      console.error("Error searching users:", error);
      setError(error.message || "An error occurred while searching users");
    } finally {
      setSearching(false);
    }
  }, [searchName, currentMembers]);

  const addUserToGroup = async (user: User) => {
    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      // Add user to the group
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      setSuccess(`${user.name} has been added to the group!`);

      // Add the new member to the current members list
      setCurrentMembers([...currentMembers, user]);

      // Remove user from available users list
      setAvailableUsers(availableUsers.filter((u) => u.id !== user.id));

      // Clear search field
      setSearchName("");
    } catch (error: any) {
      console.error("Error adding member:", error);
      setError(error.message || "An error occurred while adding the member");
    } finally {
      setInviting(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchName.trim()) {
        searchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchName, searchUsers]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {group?.name}{" "}
          <span className="text-gray-500 font-normal">• Invite</span>
        </h1>
        <Link
          href={`/groups/${groupId}`}
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Group
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6 shadow-sm">
          <div className="flex">
            <svg
              className="h-5 w-5 text-green-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{success}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Add Members by Name
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="searchName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search by Name
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="searchName"
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search users by name"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {searching && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {!searching && availableUsers.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {availableUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex justify-between items-center p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-700 font-medium">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => addUserToGroup(user)}
                      className="ml-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 px-3 rounded-lg font-medium text-sm transition-colors flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!searching &&
            searchName.trim() !== "" &&
            availableUsers.length === 0 && (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-xl">
                <p>No users found matching &quot;{searchName}&quot;</p>
              </div>
            )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Invite by Email
        </h2>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={inviting}
              className={`bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-medium py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 ${
                inviting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {inviting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Inviting...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Current Members
        </h2>

        {currentMembers.length > 0 ? (
          <div className="space-y-3">
            {currentMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-700 font-medium">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No members yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
