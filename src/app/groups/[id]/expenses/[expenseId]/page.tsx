"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { formatCurrency } from "@/utils/currency";
import { Expense, ExpenseSplit, User } from "@/types";
import ExpenseDetailSkeleton from "@/components/ui/ExpenseDetailSkeleton";

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const expenseId = params.expenseId as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [expenseSplits, setExpenseSplits] = useState<ExpenseSplit[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenseDetails = async () => {
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

        // Get expense details
        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select("*")
          .eq("id", expenseId)
          .eq("group_id", groupId)
          .single();

        if (expenseError) throw expenseError;
        setExpense(expenseData);

        // Get expense splits
        const { data: splitsData, error: splitsError } = await supabase
          .from("expense_splits")
          .select("*")
          .eq("expense_id", expenseId);

        if (splitsError) throw splitsError;
        setExpenseSplits(splitsData || []);

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
        }
      } catch (error: any) {
        console.error("Error fetching expense details:", error);
        setError(
          error.message || "An error occurred while loading the expense details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseDetails();
  }, [expenseId, groupId, router]);

  const findUserName = (userId: string) => {
    const member = members.find((m) => m.id === userId);
    return member ? member.name : "Unknown User";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <ExpenseDetailSkeleton />;
  }

  if (!expense) {
    return (
      <div className="max-w-4xl mx-auto">
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
            <span>Expense not found</span>
          </div>
        </div>
        <Link
          href={`/groups/${groupId}/expenses`}
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
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
          Back to Expenses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Breadcrumbs */}
      <nav className="flex mb-4 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1">
          <li>
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
          </li>
          <li className="flex items-center">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href="/groups" className="text-gray-500 hover:text-gray-700">
              Groups
            </Link>
          </li>
          <li className="flex items-center">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={`/groups/${groupId}`} className="text-gray-500 hover:text-gray-700">
              Group Details
            </Link>
          </li>
          <li className="flex items-center">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span className="text-gray-800 font-medium" aria-current="page">
              {expense?.description || 'Expense Details'}
            </span>
          </li>
        </ol>
      </nav>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Expense Details</h1>
        <Link
          href={`/groups/${groupId}/expenses`}
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
          Back to Expenses
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

      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {expense.description}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm mb-1">Date</p>
              <p className="text-gray-800">{formatDate(expense.date)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Amount</p>
              <p className="text-gray-800 font-semibold">
                {formatCurrency(expense.amount)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Paid By</p>
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 text-indigo-700 font-medium text-xs">
                  {findUserName(expense.paid_by).charAt(0)}
                </div>
                <p className="text-gray-800">{findUserName(expense.paid_by)}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Split Type</p>
              <p className="text-gray-800">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    expense.split_type === "equal"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {expense.split_type === "equal"
                    ? "Split equally"
                    : "Split manually"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            How it was split
          </h3>
          <div className="space-y-3">
            {expenseSplits.map((split) => (
              <div
                key={split.id}
                className="p-4 rounded-xl bg-gray-50 flex justify-between items-center"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-700 font-medium">
                    {findUserName(split.user_id).charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {findUserName(split.user_id)}
                    </p>
                    {split.user_id === expense.paid_by && (
                      <p className="text-xs text-indigo-600">
                        Paid for this expense
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">
                    {formatCurrency(split.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((split.amount / expense.amount) * 100).toFixed(0)}% of
                    total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
