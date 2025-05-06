"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { formatCurrency } from "@/utils/currency";
import { Group, User, Expense, Settlement, Activity } from "@/types";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});

  useEffect(() => {
    const fetchUserAndGroups = async () => {
      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          // Get user profile
          const { data: userData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setUser(userData);

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
            .eq("user_id", session.user.id);

          if (groupsData) {
            const formattedGroups = groupsData.map(
              (item) => item.groups
            ) as unknown as Group[];
            setGroups(formattedGroups);

            // Get all group IDs the user is a member of
            const groupIds = formattedGroups.map((group) => group.id);

            if (groupIds.length > 0) {
              // Fetch all users from the user's groups for displaying names
              const { data: groupMembersData } = await supabase
                .from("group_members")
                .select(
                  `
                  user_id,
                  profiles:user_id (
                    id,
                    name,
                    email,
                    avatar_url
                  )
                `
                )
                .in("group_id", groupIds);

              if (groupMembersData) {
                const usersMap: Record<string, User> = {};
                groupMembersData.forEach((member) => {
                  if (member.profiles) {
                    const profile = member.profiles as any;
                    usersMap[profile.id] = {
                      id: profile.id,
                      name: profile.name,
                      email: profile.email,
                      avatar_url: profile.avatar_url,
                    };
                  }
                });
                setAllUsers(usersMap);
              }

              // Get recent expenses from all user's groups
              const { data: expensesData } = await supabase
                .from("expenses")
                .select("*")
                .in("group_id", groupIds)
                .order("created_at", { ascending: false })
                .limit(5);

              // Get recent settlements from all user's groups
              const { data: settlementsData } = await supabase
                .from("settlements")
                .select("*")
                .in("group_id", groupIds)
                .order("settled_at", { ascending: false })
                .limit(5);

              // Combine and format activities
              const combinedActivities: Activity[] = [];

              // Add expenses to activities
              if (expensesData) {
                expensesData.forEach((expense) => {
                  const groupName =
                    formattedGroups.find((g) => g.id === expense.group_id)
                      ?.name || "Unknown Group";
                  combinedActivities.push({
                    id: expense.id,
                    type: "expense",
                    group_id: expense.group_id,
                    group_name: groupName,
                    date: expense.created_at,
                    amount: expense.amount,
                    description: expense.description,
                    paid_by: expense.paid_by,
                  });
                });
              }

              // Add settlements to activities
              if (settlementsData) {
                settlementsData.forEach((settlement) => {
                  const groupName =
                    formattedGroups.find((g) => g.id === settlement.group_id)
                      ?.name || "Unknown Group";
                  combinedActivities.push({
                    id: settlement.id,
                    type: "settlement",
                    group_id: settlement.group_id,
                    group_name: groupName,
                    date: settlement.settled_at,
                    amount: settlement.amount,
                    from_user_id: settlement.from_user_id,
                    to_user_id: settlement.to_user_id,
                    settled_by: settlement.settled_by,
                  });
                });
              }

              // Sort by date (newest first)
              combinedActivities.sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              );

              // Take only the 5 most recent activities
              setActivities(combinedActivities.slice(0, 5));
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

  // Helper function to find user name by ID
  const findUserName = (userId: string) => {
    return allUsers[userId]?.name || "Unknown User";
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {user?.name || "User"}
        </h1>
        <p className="text-gray-600">Manage your groups and expenses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg
              className="h-5 w-5 mr-2 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            My Groups
          </h2>

          {groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block bg-gray-50 p-4 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{group.name}</span>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>You haven&apos;t joined any groups yet.</p>
            </div>
          )}

          <div className="mt-6">
            <Link
              href="/groups/new"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <svg
                className="h-5 w-5 mr-1"
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
              Create New Group
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg
              className="h-5 w-5 mr-2 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Recent Activity
          </h2>

          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/groups/${activity.group_id}`}
                  className="block p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      {activity.type === "expense" ? (
                        <h3 className="font-medium text-gray-800">
                          {activity.description}
                        </h3>
                      ) : (
                        <h3 className="font-medium text-gray-800">
                          Settlement
                        </h3>
                      )}

                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500">
                          {formatDate(activity.date)}
                        </span>
                        <span className="mx-1.5 text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {activity.group_name}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mt-1">
                        {activity.type === "expense" && activity.paid_by && (
                          <span>Paid by {findUserName(activity.paid_by)}</span>
                        )}
                        {activity.type === "settlement" &&
                          activity.from_user_id &&
                          activity.to_user_id && (
                            <span>
                              {findUserName(activity.from_user_id)} paid{" "}
                              {findUserName(activity.to_user_id)}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(activity.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatTime(activity.date)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity to show.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Link
            href="/groups/new"
            className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:shadow-md transition-shadow"
          >
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
              <svg
                className="h-6 w-6 text-indigo-600"
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
            </div>
            <div>
              <h3 className="font-medium">Create New Group</h3>
              <p className="text-sm text-gray-500">
                Start a new expense sharing group
              </p>
            </div>
          </Link>

          {/* <Link
            href="/expenses/new"
            className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:shadow-md transition-shadow"
          >
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Add New Expense</h3>
              <p className="text-sm text-gray-500">Record a new shared expense</p>
            </div>
          </Link> */}
        </div>
      </div>
    </div>
  );
}
