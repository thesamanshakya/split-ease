"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { User } from "@/types";

export default function NewExpensePage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState<"equal" | "manual">("equal");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [members, setMembers] = useState<User[]>([]);
  const [splits, setSplits] = useState<
    { userId: string; amount: string; included: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [autoFillTarget, setAutoFillTarget] = useState<string[]>([]);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          router.push("/auth");
          return;
        }

        // Get user profile
        const { data: userData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setCurrentUser(userData);
        setPaidBy(session.user.id);

        // Get group members - two step approach
        const { data: groupMembersData, error: groupMembersError } =
          await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", groupId);

        if (groupMembersError) throw groupMembersError;

        // Get user profiles for each member
        if (groupMembersData && groupMembersData.length > 0) {
          const userIds = groupMembersData.map((member) => member.user_id);

          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name, email, avatar_url")
            .in("id", userIds);

          if (profilesError) throw profilesError;
          setMembers(profilesData || []);

          // Initialize empty splits for all members
          const initialSplits = profilesData.map((member) => ({
            userId: member.id,
            amount: "",
            included: true,
          }));
          setSplits(initialSplits);
        } else {
          setMembers([]);
          setSplits([]);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error fetching group members:", error);
        setError(
          error.message || "An error occurred while loading group members"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroupMembers();
  }, [groupId, router]);

  const updateSplits = (newAmount: string) => {
    if (splitType === "equal" && members.length > 0) {
      const numericAmount = parseFloat(newAmount || "0");
      if (!isNaN(numericAmount)) {
        // Only count included members
        const includedMembers = splits.filter((split) => split.included);
        const memberCount = includedMembers.length;

        if (memberCount > 0) {
          const perPersonAmount = (numericAmount / memberCount).toFixed(2);

          const newSplits = splits.map((split) => ({
            ...split,
            amount: split.included ? perPersonAmount : "0.00",
          }));

          setSplits(newSplits);
        }
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    updateSplits(newAmount);
  };

  const handleSplitTypeChange = (type: "equal" | "manual") => {
    setSplitType(type);
    if (type === "equal") {
      updateSplits(amount);
    }
  };

  const toggleMemberInclusion = (userId: string) => {
    // Create new splits array with the toggled member
    const newSplits = splits.map((split) =>
      split.userId === userId ? { ...split, included: !split.included } : split
    );
    setSplits(newSplits);
  };

  // Recalculate equal splits whenever splits, splitType, or amount changes
  useEffect(() => {
    if (splitType === "equal" && members.length > 0) {
      const numericAmount = parseFloat(amount || "0");
      if (!isNaN(numericAmount)) {
        const includedMembers = splits.filter((split) => split.included);
        const memberCount = includedMembers.length;
        if (memberCount > 0) {
          const perPersonAmount = (numericAmount / memberCount).toFixed(2);
          const newSplits = splits.map((split) => ({
            ...split,
            amount: split.included ? perPersonAmount : "0.00",
          }));
          setSplits(newSplits);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    splits.map((s) => s.included).join(","),
    splitType,
    amount,
    members.length,
  ]);

  const handleSplitAmountChange = (userId: string, splitAmount: string) => {
    const newSplits = splits.map((split) =>
      split.userId === userId ? { ...split, amount: splitAmount } : split
    );
    setSplits(newSplits);
  };

  const autoFillRemainingAmount = () => {
    if (!amount || autoFillTarget.length === 0) return;

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount)) return;

    // Calculate how much is already allocated
    const allocatedAmount = splits
      .filter(
        (split) => split.included && !autoFillTarget.includes(split.userId)
      )
      .reduce((sum, split) => {
        const splitAmount = parseFloat(split.amount || "0");
        return sum + (isNaN(splitAmount) ? 0 : splitAmount);
      }, 0);

    // Calculate remaining amount
    const remainingAmount = totalAmount - allocatedAmount;
    if (remainingAmount <= 0) return;

    // Calculate per-person amount for target members
    const perPersonAmount = remainingAmount / autoFillTarget.length;
    const roundedPerPersonAmount = Math.floor(perPersonAmount * 100) / 100; // Round down to 2 decimal places

    // Calculate if we need to adjust the last person's amount to match the total
    let newSplits = [...splits];

    // Calculate total after rounding
    const totalAfterRounding =
      allocatedAmount + roundedPerPersonAmount * autoFillTarget.length;
    const roundingDifference = totalAmount - totalAfterRounding;

    // Apply rounded amounts to all targeted users
    newSplits = newSplits.map((split) => {
      if (split.included && autoFillTarget.includes(split.userId)) {
        return { ...split, amount: roundedPerPersonAmount.toFixed(2) };
      }
      return split;
    });

    // If there's a rounding difference, add it to the last person
    if (roundingDifference > 0 && autoFillTarget.length > 0) {
      const lastTargetUserId = autoFillTarget[autoFillTarget.length - 1];
      newSplits = newSplits.map((split) => {
        if (split.userId === lastTargetUserId) {
          const adjustedAmount = (
            parseFloat(split.amount) + roundingDifference
          ).toFixed(2);
          return { ...split, amount: adjustedAmount };
        }
        return split;
      });
    }

    setSplits(newSplits);
    setAutoFillTarget([]);
  };

  const toggleAutoFillTarget = (userId: string) => {
    if (autoFillTarget.includes(userId)) {
      setAutoFillTarget(autoFillTarget.filter((id) => id !== userId));
    } else {
      setAutoFillTarget([...autoFillTarget, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate the total split amount equals the expense amount
      if (splitType === "manual") {
        const totalSplitAmount = splits
          .filter((split) => split.included)
          .reduce((sum, split) => sum + parseFloat(split.amount || "0"), 0);
        const expenseAmount = parseFloat(amount);

        if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
          throw new Error(
            `The split amounts total (${totalSplitAmount.toFixed(
              2
            )}) must equal the expense amount (${expenseAmount.toFixed(2)})`
          );
        }
      }

      // Create the expense
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .insert([
          {
            group_id: groupId,
            description,
            amount: parseFloat(amount),
            paid_by: paidBy,
            date,
            split_type: splitType,
            created_at: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      if (expenseError) throw expenseError;

      // Create the expense splits - only for included members
      const expenseSplits = splits
        .filter((split) => split.included)
        .map((split) => ({
          expense_id: expenseData.id,
          user_id: split.userId,
          amount: parseFloat(split.amount || "0"),
        }));

      const { error: splitsError } = await supabase
        .from("expense_splits")
        .insert(expenseSplits);

      if (splitsError) throw splitsError;

      // Redirect back to the group page
      router.push(`/groups/${groupId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(error.message || "An error occurred while creating the expense");
      setSubmitting(false);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">New Expense</h1>
        <button
          onClick={() => router.back()}
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
          Cancel
        </button>
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

      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner at Italian Restaurant"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Total Amount
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500">रु</span>
              </div>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="paidBy"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Paid By
            </label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select who paid</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} {member.id === currentUser?.id ? "(You)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Split Type
            </label>
            <div className="flex space-x-4 bg-gray-50 p-3 rounded-xl">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="equal"
                  checked={splitType === "equal"}
                  onChange={() => handleSplitTypeChange("equal")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-800">
                  Split equally
                </span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={splitType === "manual"}
                  onChange={() => handleSplitTypeChange("manual")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-800">
                  Split manually
                </span>
              </label>
            </div>
          </div>

          {splitType === "manual" && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-base font-medium mb-2 text-gray-800">
                Custom Split
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Specify how much each person owes. The total should equal रु
                {amount || "0.00"}.
              </p>

              {autoFillTarget.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Auto-calculate</span> for{" "}
                    {autoFillTarget.length} selected member
                    {autoFillTarget.length > 1 ? "s" : ""}
                  </div>
                  <button
                    type="button"
                    onClick={autoFillRemainingAmount}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Calculate Now
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {splits.map((split) => {
                  const member = members.find((m) => m.id === split.userId);
                  return (
                    <div
                      key={split.userId}
                      className={`md:flex items-center p-3 rounded-xl ${
                        split.included ? "bg-gray-50" : "bg-gray-100 opacity-75"
                      }`}
                    >
                      <div className="flex items-center md:w-1/2 mb-2 md:mb-0">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 text-sm ${
                            split.included
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {member?.name?.charAt(0) || "?"}
                        </div>
                        <span
                          className={`font-medium truncate ${
                            split.included ? "text-gray-800" : "text-gray-500"
                          }`}
                        >
                          {member?.name}{" "}
                          {member?.id === currentUser?.id ? "(You)" : ""}
                        </span>
                      </div>

                      <div className="md:w-1/2 flex gap-2">
                        <div className="relative rounded-xl shadow-sm flex-grow">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">रु</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={split.amount}
                            onChange={(e) =>
                              handleSplitAmountChange(
                                split.userId,
                                e.target.value
                              )
                            }
                            disabled={!split.included}
                            placeholder="0.00"
                            className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl ${
                              split.included ? "bg-white" : "bg-gray-100"
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                          />
                        </div>

                        {splitType === "manual" && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleAutoFillTarget(split.userId)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                autoFillTarget.includes(split.userId)
                                  ? "bg-indigo-100 text-indigo-600"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              } ${
                                !split.included
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={!split.included}
                              title="Select for auto-calculation"
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
                                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleMemberInclusion(split.userId)
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                split.included
                                  ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  : "bg-red-100 text-red-600"
                              }`}
                              title={
                                split.included
                                  ? "Exclude member"
                                  : "Include member"
                              }
                            >
                              {split.included ? (
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              ) : (
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {splitType === "equal" && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-base font-medium mb-2 text-gray-800">
                Who&apos;s participating?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Deselect anyone who shouldn&apos;t be included in this expense.
              </p>

              <div className="space-y-3">
                {splits.map((split) => {
                  const member = members.find((m) => m.id === split.userId);
                  return (
                    <div
                      key={split.userId}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        split.included ? "bg-gray-50" : "bg-gray-100 opacity-75"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 text-sm ${
                            split.included
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {member?.name?.charAt(0) || "?"}
                        </div>
                        <span
                          className={`font-medium ${
                            split.included ? "text-gray-800" : "text-gray-500"
                          }`}
                        >
                          {member?.name}{" "}
                          {member?.id === currentUser?.id ? "(You)" : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {split.included && (
                          <span className="text-sm font-medium text-gray-700">
                            रु {split.amount}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleMemberInclusion(split.userId)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            split.included
                              ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              : "bg-red-100 text-red-600"
                          }`}
                          title={
                            split.included ? "Exclude member" : "Include member"
                          }
                        >
                          {split.included ? (
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          ) : (
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
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-1/3 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-2/3 bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-medium py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
              submitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? (
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
                Saving...
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Expense
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
