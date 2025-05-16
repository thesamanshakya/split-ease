"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { formatCurrency } from "@/utils/currency";
import { Toaster } from "react-hot-toast";
import LoginSuccessHandler from "@/components/auth/LoginSuccessHandler";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import {
  Group,
  User,
  Expense,
  Settlement,
  Activity,
  ExpenseSplit,
  Balance,
} from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [, setAllExpenses] = useState<Expense[]>([]);
  const [, setAllExpenseSplits] = useState<ExpenseSplit[]>([]);
  const [, setAllSettlements] = useState<Settlement[]>([]);
  const [aggregatedBalances, setAggregatedBalances] = useState<Balance[]>([]);
  const [totalToPay, setTotalToPay] = useState<number>(0);
  const [totalToReceive, setTotalToReceive] = useState<number>(0);
  const [chartData, setChartData] = useState<
    { category: string; amount: number }[]
  >([]);
  const [groupBalances, setGroupBalances] = useState<Record<string, number>>(
    {}
  );

  // Function to calculate balances from expenses, members, expense splits, and settlements
  const calculateAggregatedBalances = (
    members: User[],
    expenses: Expense[],
    expenseSplits: ExpenseSplit[],
    settlements: Settlement[] = []
  ): Balance[] => {
    const balanceMap = new Map<string, number>();

    // Initialize balances for all members
    members.forEach((member) => {
      balanceMap.set(member.id, 0);
    });

    // Calculate balances based on expenses
    expenses.forEach((expense) => {
      const paidBy = expense.paid_by;

      // Add the full amount to the person who paid
      balanceMap.set(paidBy, (balanceMap.get(paidBy) || 0) + expense.amount);

      if (expense.split_type === "equal") {
        // For equal splits, calculate the split amount based on member count
        const includedMembers = members.length;
        const splitAmount = expense.amount / includedMembers;

        // Subtract the split amount from each member (including the payer)
        members.forEach((member) => {
          balanceMap.set(
            member.id,
            (balanceMap.get(member.id) || 0) - splitAmount
          );
        });
      } else if (expense.split_type === "manual") {
        // For manual splits, use the actual split amounts from expense_splits
        const expenseSplitsForThisExpense = expenseSplits.filter(
          (split) => split.expense_id === expense.id
        );

        // Subtract each person's split amount
        expenseSplitsForThisExpense.forEach((split) => {
          balanceMap.set(
            split.user_id,
            (balanceMap.get(split.user_id) || 0) - split.amount
          );
        });
      }
    });

    // Apply settlements to the balances
    settlements.forEach((settlement) => {
      // The person who paid (from_user_id) gets a credit
      balanceMap.set(
        settlement.from_user_id,
        (balanceMap.get(settlement.from_user_id) || 0) + settlement.amount
      );

      // The person who received (to_user_id) gets a debit
      balanceMap.set(
        settlement.to_user_id,
        (balanceMap.get(settlement.to_user_id) || 0) - settlement.amount
      );
    });

    // Convert the map to an array of Balance objects
    return Array.from(balanceMap).map(([user_id, amount]) => ({
      user_id,
      amount,
    }));
  };

  // Function to calculate balances per group
  const calculateGroupBalances = (
    userId: string,
    groups: Group[],
    allExpenses: Expense[],
    allExpenseSplits: ExpenseSplit[],
    allSettlements: Settlement[],
    allUsers: Record<string, User>
  ): Record<string, number> => {
    const groupBalances: Record<string, number> = {};

    // Initialize balances for all groups
    groups.forEach((group) => {
      groupBalances[group.id] = 0;
    });

    // Process each group separately
    groups.forEach((group) => {
      // Filter data for this group
      const groupExpenses = allExpenses.filter(
        (expense) => expense.group_id === group.id
      );
      const groupSettlements = allSettlements.filter(
        (settlement) => settlement.group_id === group.id
      );

      // Get all expense IDs for this group
      const expenseIds = groupExpenses.map((expense) => expense.id);

      // Filter expense splits for this group's expenses
      const groupExpenseSplits = allExpenseSplits.filter((split) =>
        expenseIds.includes(split.expense_id)
      );

      // Get all user IDs in this group
      const userIds = Object.keys(allUsers);
      const groupMembers = userIds.map((id) => allUsers[id]);

      // Calculate balances for this group
      const balances = calculateAggregatedBalances(
        groupMembers,
        groupExpenses,
        groupExpenseSplits,
        groupSettlements
      );

      // Find the current user's balance in this group
      const userBalance = balances.find(
        (balance) => balance.user_id === userId
      );
      if (userBalance) {
        groupBalances[group.id] = userBalance.amount;
      }
    });

    return groupBalances;
  };

  useEffect(() => {
    const fetchUserAndGroups = async () => {
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
          setLoading(false);
          return;
        }

        const sessionData = await response.json();

        if (sessionData.isLoggedIn && sessionData.user) {
          const userId = sessionData.user.id;
          setUser(sessionData.user);

          // Get user profile (if needed for additional data)
          const { data: userData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (userData) {
            setUser(userData);
          }

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
              // Fetch all users from the user's groups for displaying names
              // First, get all user_ids from group_members
              const { data: groupMembersData } = await supabase
                .from("group_members")
                .select("user_id")
                .in("group_id", groupIds);

              // Create a map of all users
              const usersMap: Record<string, User> = {};

              if (groupMembersData && groupMembersData.length > 0) {
                // Get unique user IDs
                const userIds = [
                  ...new Set(groupMembersData.map((member) => member.user_id)),
                ];

                // Then fetch the profiles for those users
                const { data: profilesData } = await supabase
                  .from("profiles")
                  .select("id, name, email, avatar_url")
                  .in("id", userIds);

                if (profilesData) {
                  profilesData.forEach((profile) => {
                    usersMap[profile.id] = {
                      id: profile.id,
                      name: profile.name,
                      email: profile.email,
                      avatar_url: profile.avatar_url,
                    };
                  });
                  setAllUsers(usersMap);
                }
              }

              // Get all expenses from all user's groups (not just recent ones)
              const { data: allExpensesData } = await supabase
                .from("expenses")
                .select("*")
                .in("group_id", groupIds);

              // Get all expense splits for all expenses
              let allExpenseSplitsData: ExpenseSplit[] = [];
              if (allExpensesData && allExpensesData.length > 0) {
                const expenseIds = allExpensesData.map((expense) => expense.id);

                const { data: splitData } = await supabase
                  .from("expense_splits")
                  .select("*")
                  .in("expense_id", expenseIds);

                if (splitData) {
                  allExpenseSplitsData = splitData;
                }
              }

              // Get all settlements from all user's groups
              const { data: allSettlementsData } = await supabase
                .from("settlements")
                .select("*")
                .in("group_id", groupIds);

              // Store all data
              const allExpensesArray = allExpensesData || [];
              setAllExpenses(allExpensesArray);
              setAllExpenseSplits(allExpenseSplitsData || []);
              setAllSettlements(allSettlementsData || []);

              // Process chart data
              if (allExpensesArray.length > 0) {
                const categoryMap = new Map<string, number>();

                allExpensesArray.forEach((expense) => {
                  const expenseCategory = expense.description || "Other";
                  const current = categoryMap.get(expenseCategory) || 0;
                  categoryMap.set(expenseCategory, current + expense.amount);
                });

                const processedData = Array.from(categoryMap)
                  .map(([category, amount]) => ({
                    category:
                      category.length > 15
                        ? category.substring(0, 15) + "..."
                        : category,
                    amount: Math.round(amount),
                  }))
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 8);

                setChartData(processedData);
              }

              // Calculate aggregated balances
              if (allExpensesData && Object.keys(usersMap).length > 0) {
                const members = Object.values(usersMap);
                const balances = calculateAggregatedBalances(
                  members,
                  allExpensesData,
                  allExpenseSplitsData,
                  allSettlementsData || []
                );

                setAggregatedBalances(balances);

                // Find the current user's balance
                const currentUserBalance = balances.find(
                  (b) => b.user_id === userId
                );

                if (currentUserBalance) {
                  // If current user has positive balance, they should receive money
                  if (currentUserBalance.amount > 0) {
                    setTotalToReceive(currentUserBalance.amount);
                    setTotalToPay(0);
                  }
                  // If current user has negative balance, they should pay money
                  else if (currentUserBalance.amount < 0) {
                    setTotalToPay(Math.abs(currentUserBalance.amount));
                    setTotalToReceive(0);
                  }
                  // If current user has zero balance, they don't need to pay or receive
                  else {
                    setTotalToPay(0);
                    setTotalToReceive(0);
                  }
                } else {
                  setTotalToPay(0);
                  setTotalToReceive(0);
                }

                // Calculate balances per group
                const perGroupBalances = calculateGroupBalances(
                  userId,
                  formattedGroups,
                  allExpensesArray,
                  allExpenseSplitsData || [],
                  allSettlementsData || [],
                  usersMap
                );

                setGroupBalances(perGroupBalances);
              }

              // Get recent expenses for activity feed
              const { data: expensesData } = await supabase
                .from("expenses")
                .select("*")
                .in("group_id", groupIds)
                .order("created_at", { ascending: false })
                .limit(5);

              // Get recent settlements for activity feed
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
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster position="top-center" />
      <Suspense fallback={null}>
        <LoginSuccessHandler />
      </Suspense>

      {/* Breadcrumbs */}
      <nav className="flex mb-4 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1">
          <li>
            <span className="text-gray-800 font-medium" aria-current="page">
              Dashboard
            </span>
          </li>
        </ol>
      </nav>

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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0"
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
                    <div className="flex items-center">
                      {groupBalances[group.id] !== undefined && (
                        <span
                          className={`mr-2 text-sm font-medium ${
                            groupBalances[group.id] < 0
                              ? "text-red-600"
                              : groupBalances[group.id] > 0
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          {groupBalances[group.id] < 0
                            ? `To pay ${formatCurrency(
                                Math.abs(groupBalances[group.id])
                              )}`
                            : groupBalances[group.id] > 0
                            ? `To receive ${formatCurrency(
                                groupBalances[group.id]
                              )}`
                            : "All settled"}
                        </span>
                      )}
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
            <div className="space-y-2.5 overflow-y-auto max-h-96">
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

      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="md:flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Expense Analytics
          </h2>
          <div className="text-sm text-gray-500">Top 8 expense categories</div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                barSize={40}
                barGap={8}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: "#4b5563" }}
                  angle={-45}
                  textAnchor="end"
                  tickMargin={10}
                  axisLine={{ stroke: "#e5e7eb" }}
                  height={60}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12, fill: "#4b5563" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  domain={[0, "dataMax + 1000"]}
                  width={70}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Total Spent",
                  ]}
                  labelFormatter={(label) => `Category: ${label}`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    padding: "10px 14px",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(79, 70, 229, 0.1)" }}
                  active={true}
                />
                <Bar
                  dataKey="amount"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  name="Total Spent"
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-60 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
            <svg
              className="h-12 w-12 mb-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-center">
              No expense data available yet.
              <br />
              Add expenses to see analytics.
            </p>
          </div>
        )}
      </section>

      {/* Payment Summary Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
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
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
          Payment Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg ${
              totalToPay > 0 ? "bg-red-50" : "bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total to Pay</p>
                <p
                  className={`text-xl font-semibold ${
                    totalToPay > 0 ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  {totalToPay > 0
                    ? formatCurrency(totalToPay)
                    : "No payments due"}
                </p>
              </div>
              <div
                className={`h-10 w-10 rounded-full ${
                  totalToPay > 0
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-400"
                } flex items-center justify-center`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${
              totalToReceive > 0 ? "bg-green-50" : "bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total to Receive</p>
                <p
                  className={`text-xl font-semibold ${
                    totalToReceive > 0 ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {totalToReceive > 0
                    ? formatCurrency(totalToReceive)
                    : "No payments to receive"}
                </p>
              </div>
              <div
                className={`h-10 w-10 rounded-full ${
                  totalToReceive > 0
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                } flex items-center justify-center`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {aggregatedBalances.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Payment Details</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {aggregatedBalances
                .filter(
                  (balance) =>
                    balance.user_id !== user?.id && balance.amount !== 0
                )
                .map((balance) => {
                  const isPositive = balance.amount > 0;
                  return (
                    <div
                      key={balance.user_id}
                      className={`p-3 rounded-lg ${
                        isPositive ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full mr-3 overflow-hidden">
                            {allUsers[balance.user_id]?.avatar_url ? (
                              <img
                                src={allUsers[balance.user_id].avatar_url}
                                alt={`${findUserName(
                                  balance.user_id
                                )}'s avatar`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div
                                className={`h-full w-full ${
                                  isPositive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                } flex items-center justify-center font-medium text-sm`}
                              >
                                {findUserName(balance.user_id).charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium">
                            {findUserName(balance.user_id)}
                          </span>
                        </div>
                        <div
                          className={`font-medium ${
                            isPositive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isPositive
                            ? `To receive ${formatCurrency(balance.amount)}`
                            : `To pay ${formatCurrency(
                                Math.abs(balance.amount)
                              )}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
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
