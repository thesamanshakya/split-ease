"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Group, User } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Calendar, ArrowRight } from "lucide-react";

export default function GroupsPage() {
  const [, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchUserAndGroups = async () => {
      try {
        // Get current user from our session API
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch session:", response.status);
          setLoading(false);
          return;
        }

        const sessionData = await response.json();

        if (sessionData.isLoggedIn && sessionData.user) {
          const userId = sessionData.user.id;
          setUser(sessionData.user);

          // Get user's groups
          const { data: groupsData } = await supabase
            .from("group_members")
            .select(
              `
              group_id,
              groups:group_id (
                id,
                name,
                created_at,
                created_by
              )
            `
            )
            .eq("user_id", userId);

          if (groupsData) {
            const formattedGroups = groupsData.map(
              (item) => item.groups
            ) as unknown as Group[];
            setGroups(formattedGroups);

            // Get all group IDs the user is a member of
            const groupIds = formattedGroups.map((group) => group.id);

            if (groupIds.length > 0) {
              // Get member count for each group
              const memberCounts: Record<string, number> = {};

              // Fetch actual member counts for each group
              for (const groupId of groupIds) {
                const { count } = await supabase
                  .from("group_members")
                  .select("*", { count: "exact", head: true })
                  .eq("group_id", groupId);

                memberCounts[groupId] = count || 0;
              }

              setGroupMembers(memberCounts);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndGroups();
  }, []);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Groups</h1>
          <p className="text-gray-600">Manage your expense groups</p>
        </div>
        <Link href="/groups/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Group
          </Button>
        </Link>
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">{group.name}</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2 text-indigo-500" />
                    <span>{groupMembers[group.id] || 0} members</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                    <span>Created on {formatDate(group.created_at)}</span>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <span className="text-indigo-600 flex items-center text-sm font-medium">
                    View Details
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
          <h3 className="text-xl font-medium mb-2">No Groups Yet</h3>
          <p className="text-gray-600 mb-6">
            You haven&apos;t created or joined any expense groups yet.
          </p>
          <Link href="/groups/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Group
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
