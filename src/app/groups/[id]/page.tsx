"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { formatCurrency } from "@/utils/currency";
import { Group, User, Expense, Balance, ExpenseSplit } from "@/types";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

interface Settlement {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  settled_at: string;
  settled_by: string;
}

export default function GroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // We still need setExpenseSplits for the useEffect
  const [, setExpenseSplits] = useState<ExpenseSplit[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [, setSettlements] = useState<Settlement[]>([]);

  // Function to calculate balances from expenses, members, expense splits, and settlements
  const calculateBalances = (
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

        setCurrentUser(sessionData.user);

        // Get group details
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        // Get group members - two step approach
        const { data: groupMembersData, error: groupMembersError } =
          await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", groupId);

        if (groupMembersError) throw groupMembersError;

        // Get user profiles for each member
        let profilesData: User[] = [];
        if (groupMembersData && groupMembersData.length > 0) {
          const userIds = groupMembersData.map((member) => member.user_id);

          const { data: fetchedProfiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name, email, avatar_url")
            .in("id", userIds);

          if (profilesError) throw profilesError;
          profilesData = fetchedProfiles || [];
          // We'll set members later after calculating balances
        } else {
          // No members in this group
        }

        // Get group expenses
        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select("*")
          .eq("group_id", groupId)
          .order("date", { ascending: false });

        if (expenseError) throw expenseError;
        setExpenses(expenseData || []);

        // Get expense splits for all expenses in this group
        let allExpenseSplits: ExpenseSplit[] = [];
        if (expenseData && expenseData.length > 0) {
          const expenseIds = expenseData.map((expense) => expense.id);

          const { data: splitData, error: splitError } = await supabase
            .from("expense_splits")
            .select("*")
            .in("expense_id", expenseIds);

          if (splitError) throw splitError;
          allExpenseSplits = splitData || [];
          setExpenseSplits(allExpenseSplits);
        }

        // Get recorded settlements
        const { data: settlementsData, error: settlementsError } =
          await supabase
            .from("settlements")
            .select("*")
            .eq("group_id", groupId);

        if (settlementsError) {
          // If the table doesn't exist yet, this will fail silently
          console.error("Error fetching settlements:", settlementsError);
        } else {
          setSettlements(settlementsData || []);
        }

        // Get the updated members list from the profiles data we fetched earlier
        const updatedMembers = profilesData || [];
        setMembers(updatedMembers);

        // Calculate balances if we have both members and expenses
        if (updatedMembers.length > 0 && expenseData) {
          const calculatedBalances = calculateBalances(
            updatedMembers,
            expenseData,
            allExpenseSplits,
            settlementsData || []
          );
          setBalances(calculatedBalances);
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred while loading the group"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, router]);

  const handleRemoveMember = async (userId: string) => {
    if (
      !confirm(`Are you sure you want to remove this member from the group?`)
    ) {
      return;
    }

    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;

      // Update the members list
      setMembers(members.filter((member) => member.id !== userId));
      toast.success("Member removed successfully");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member"
      );
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || "Group not found"}
      </div>
    );
  }

  const findUserName = (userId: string) => {
    const member = members.find((m) => m.id === userId);
    return member ? member.name : "Unknown User";
  };

  const findUserAvatar = (userId: string) => {
    const member = members.find((m) => m.id === userId);
    return member?.avatar_url || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
          <p className="text-gray-500">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
        <Link
          href={`/groups/${groupId}/expenses/new`}
          className="bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-medium py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1"
        >
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Expense
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Expenses
            </h2>
            {expenses.length > 0 && (
              <Link
                href={`/groups/${groupId}/expenses`}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
              >
                View all
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {expense.description}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatDate(expense.date)} • Paid by{" "}
                        {findUserName(expense.paid_by)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {expense.split_type === "equal"
                          ? "Split equally"
                          : "Split manually"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-gray-500 font-medium">
                No expenses yet. Add your first expense!
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Balances</h2>
          {balances.length > 0 ? (
            <div className="space-y-2">
              {balances.map((balance) => {
                const isCurrentUser = balance.user_id === currentUser?.id;

                return (
                  <div
                    key={balance.user_id}
                    className={`py-3 px-4 rounded-xl ${
                      isCurrentUser ? "bg-indigo-50" : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center mr-3 text-indigo-700 font-medium text-sm">
                          {findUserAvatar(balance.user_id) ? (
                            <Image
                              src={findUserAvatar(balance.user_id) || ""}
                              alt={findUserName(balance.user_id)}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            findUserName(balance.user_id).charAt(0)
                          )}
                        </div>
                        <span
                          title={findUserName(balance.user_id)}
                          className="font-medium text-gray-800 truncate max-w-[130px]"
                        >
                          {findUserName(balance.user_id)}
                        </span>
                      </div>
                      <div
                        className={`font-medium text-right ml-2 text-sm ${
                          balance.amount === 0
                            ? "text-gray-600"
                            : balance.amount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {balance.amount === 0 ? (
                          <span className="block mt-1.5">All settled</span>
                        ) : balance.amount > 0 ? (
                          <>
                            To receive
                            <br />
                            {formatCurrency(balance.amount)}
                          </>
                        ) : (
                          <>
                            To pay
                            <br />
                            {formatCurrency(Math.abs(balance.amount))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No balances to show.</p>
            </div>
          )}

          <div className="mt-6">
            <Link
              href={`/groups/${groupId}/settle`}
              className="block w-full bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-white font-medium py-3 px-4 rounded-xl text-center shadow-sm transition-all"
            >
              Settle Up
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Group Members</h2>
          <Link
            href={`/groups/${groupId}/invite`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            <svg
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
            Invite People
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center mr-3 text-indigo-700 font-medium">
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
                  <div className="text-xs text-gray-500">{member.email}</div>
                </div>
              </div>
              {currentUser?.id !== member.id && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={isRemoving}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                  title="Remove member"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
