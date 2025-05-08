"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/utils/supabase";
import { formatCurrency } from "@/utils/currency";
import { User, Expense, ExpenseSplit } from "@/types";
import toast, { Toaster } from "react-hot-toast";

interface Settlement {
  from: string;
  to: string;
  amount: number;
  isSettled?: boolean;
  settledAt?: string;
}

interface Balance {
  user_id: string;
  amount: number;
}

interface RecordedSettlement {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  settled_at: string;
  settled_by: string;
}

export default function SettleUpPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  // We still need setExpenses and setExpenseSplits for the useEffect
  const [, setExpenses] = useState<Expense[]>([]);
  const [, setExpenseSplits] = useState<ExpenseSplit[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [, setRecordedSettlements] = useState<RecordedSettlement[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [settlingTransaction, setSettlingTransaction] = useState(false);

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
          .select("id, name")
          .eq("id", groupId)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        // Get group members
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
          setMembers(profilesData || []);

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
            setRecordedSettlements(settlementsData || []);
          }

          // Calculate balances
          if (expenseData && profilesData.length > 0) {
            // Use the new calculateBalances function
            const balanceArray = calculateBalances(
              profilesData,
              expenseData,
              allExpenseSplits,
              settlementsData || []
            );

            console.log("Calculated balances:", balanceArray);
            // Ensure we're not getting zero balances due to rounding issues
            const nonZeroBalances = balanceArray.map((balance) => ({
              ...balance,
              // Preserve the original amount without rounding
              amount: balance.amount,
            }));
            setBalances(nonZeroBalances);

            // Calculate optimal settlements
            const settlements = calculateSettlements(balanceArray);

            // Mark settlements as settled if they've been recorded
            if (settlementsData && settlementsData.length > 0) {
              const updatedSettlements = settlements.map((settlement) => {
                const isSettled = settlementsData.some(
                  (s) =>
                    s.from_user_id === settlement.from &&
                    s.to_user_id === settlement.to &&
                    Math.abs(s.amount - settlement.amount) < 0.01
                );

                if (isSettled) {
                  const matchedSettlement = settlementsData.find(
                    (s) =>
                      s.from_user_id === settlement.from &&
                      s.to_user_id === settlement.to
                  );

                  return {
                    ...settlement,
                    isSettled: true,
                    settledAt: matchedSettlement?.settled_at,
                  };
                }

                return settlement;
              });

              setSettlements(updatedSettlements);
            } else {
              setSettlements(settlements);
            }
          }
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

  // Function to calculate balances from expenses, members, expense splits, and settlements
  const calculateBalances = (
    members: User[],
    expenses: Expense[],
    expenseSplits: ExpenseSplit[],
    recordedSettlements: RecordedSettlement[] = []
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
    recordedSettlements.forEach((settlement) => {
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

  // Calculate the optimal way to settle up
  const calculateSettlements = (balances: Balance[]): Settlement[] => {
    // Separate out people who owe money (negative balance) and people who are owed money (positive balance)
    const debtors = balances
      .filter((b) => b.amount < 0)
      .sort((a, b) => a.amount - b.amount);
    const creditors = balances
      .filter((b) => b.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // People with zero balance don't need to do anything
    const settlements: Settlement[] = [];

    let i = 0; // Index for debtors
    let j = 0; // Index for creditors

    // While there are still debtors and creditors to process
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // The amount to settle is the minimum of the absolute debt and the absolute credit
      const amountToSettle = Math.min(Math.abs(debtor.amount), creditor.amount);

      if (amountToSettle > 0.01) {
        // Only include non-trivial settlements (above 1 cent)
        settlements.push({
          from: debtor.user_id,
          to: creditor.user_id,
          amount: amountToSettle,
        });
      }

      // Update balances
      debtor.amount += amountToSettle;
      creditor.amount -= amountToSettle;

      // If the debtor's balance is now approximately zero, move to the next debtor
      if (Math.abs(debtor.amount) < 0.01) {
        i++;
      }

      // If the creditor's balance is now approximately zero, move to the next creditor
      if (creditor.amount < 0.01) {
        j++;
      }
    }

    return settlements;
  };

  const findUserName = (userId: string) => {
    const member = members.find((m) => m.id === userId);
    return member ? member.name : "Unknown User";
  };

  const findUserAvatar = (userId: string) => {
    const member = members.find((m) => m.id === userId);
    return member?.avatar_url || null;
  };

  const handleSettleTransaction = async (settlement: Settlement) => {
    if (!currentUser || !group) return;

    // Only the person who owes money (from) can settle
    if (settlement.from !== currentUser.id) {
      toast.error(
        "Only the person who owes money can mark a transaction as settled"
      );
      return;
    }

    // Don't allow settling if it's already settled
    if (settlement.isSettled) {
      toast.error("This transaction is already settled");
      return;
    }

    // Show confirmation dialog
    const isConfirmed = window.confirm(
      `I confirm that I have sent ${formatCurrency(
        settlement.amount
      )} to ${findUserName(settlement.to)}.`
    );

    if (!isConfirmed) {
      return; // User canceled the confirmation
    }

    setSettlingTransaction(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Record the settlement in the database
      const { error: settlementError } = await supabase
        .from("settlements")
        .insert([
          {
            group_id: groupId,
            from_user_id: settlement.from,
            to_user_id: settlement.to,
            amount: settlement.amount,
            settled_by: currentUser.id,
          },
        ]);

      if (settlementError) throw settlementError;

      // Update the UI to show the settlement as settled
      const updatedSettlements = settlements.map((s) => {
        if (
          s.from === settlement.from &&
          s.to === settlement.to &&
          Math.abs(s.amount - settlement.amount) < 0.01
        ) {
          return {
            ...s,
            isSettled: true,
            settledAt: new Date().toISOString(),
          };
        }
        return s;
      });

      setSettlements(updatedSettlements);

      // Show success message
      toast.success(
        `You have settled your debt of ${formatCurrency(
          settlement.amount
        )} to ${findUserName(settlement.to)}`
      );

      // Refresh the settlements data
      const { data: settlementsData } = await supabase
        .from("settlements")
        .select("*")
        .eq("group_id", groupId);

      setRecordedSettlements(settlementsData || []);
    } catch (error) {
      console.error("Error settling transaction:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while settling the transaction"
      );
    } finally {
      setSettlingTransaction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Toast notifications */}
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {group?.name}{" "}
          <span className="text-gray-500 font-normal">• Settle Up</span>
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

      {successMessage && (
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
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Current Balances (Who Pays/Receives)
        </h2>

        <div className="space-y-2 mb-2">
          {balances.map((balance) => {
            const isCurrentUser = balance.user_id === currentUser?.id;
            return (
              <div
                key={balance.user_id}
                className={`py-3 px-4 rounded-xl ${
                  isCurrentUser ? "bg-indigo-50" : "hover:bg-gray-50"
                } transition-colors`}
              >
                <div className="flex justify-between items-center">
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
                    <span className="font-medium text-gray-800">
                      {findUserName(balance.user_id)}
                    </span>
                  </div>
                  <span
                    className={`font-medium ${
                      Math.abs(balance.amount) < 0.01
                        ? "text-gray-600"
                        : balance.amount > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.abs(balance.amount) < 0.01
                      ? "All settled"
                      : balance.amount > 0
                      ? `Has to receive ${formatCurrency(balance.amount)}`
                      : `Has to pay ${formatCurrency(
                          Math.abs(balance.amount)
                        )}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Suggested Payments (Who Pays To Whom)
        </h2>

        {settlements.length > 0 ? (
          <div className="space-y-3">
            {settlements.map((settlement, index) => {
              const fromIsCurrentUser = settlement.from === currentUser?.id;
              const toIsCurrentUser = settlement.to === currentUser?.id;
              const canSettle = fromIsCurrentUser && !settlement.isSettled;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${
                    settlement.isSettled
                      ? "bg-green-50"
                      : fromIsCurrentUser || toIsCurrentUser
                      ? "bg-indigo-50"
                      : "bg-gray-50"
                  } transition-all hover:shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                        {findUserAvatar(settlement.from) ? (
                          <Image
                            src={findUserAvatar(settlement.from) || ""}
                            alt={findUserName(settlement.from)}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          findUserName(settlement.from).charAt(0)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="font-medium text-gray-800">
                          {fromIsCurrentUser
                            ? "You"
                            : findUserName(settlement.from)}
                          <span className="text-gray-500 mx-1">→</span>
                          {toIsCurrentUser
                            ? "You"
                            : findUserName(settlement.to)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {fromIsCurrentUser
                            ? `You have to pay ${formatCurrency(
                                settlement.amount
                              )} to ${findUserName(settlement.to)}`
                            : ""}
                          {toIsCurrentUser
                            ? `${findUserName(
                                settlement.from
                              )} has to pay ${formatCurrency(
                                settlement.amount
                              )} to you`
                            : ""}
                          {!fromIsCurrentUser && !toIsCurrentUser
                            ? `${findUserName(
                                settlement.from
                              )} has to pay ${formatCurrency(
                                settlement.amount
                              )} to ${findUserName(settlement.to)}`
                            : ""}
                        </p>

                        {settlement.isSettled && (
                          <p className="text-xs text-green-600 mt-1 flex items-center">
                            <svg
                              className="h-3 w-3 mr-1"
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
                            Settled{" "}
                            {settlement.settledAt &&
                              new Date(
                                settlement.settledAt
                              ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-lg font-semibold text-gray-800">
                        {formatCurrency(settlement.amount)}
                      </div>

                      {canSettle && (
                        <button
                          onClick={() => handleSettleTransaction(settlement)}
                          disabled={settlingTransaction}
                          className="mt-2 text-sm bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-lg transition-colors"
                        >
                          {settlingTransaction ? "Processing..." : "Settle"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-gray-500 font-medium">
              No payments needed! Everyone is settled up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
