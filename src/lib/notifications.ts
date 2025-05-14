import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";
import { NotificationType } from "@/types";
import { formatCurrency } from "@/utils/currency";

/**
 * Creates a notification for a user
 */
export async function createNotification({
  userId,
  type,
  content,
  relatedId,
  groupId,
}: {
  userId: string;
  type: NotificationType;
  content: string;
  relatedId?: string;
  groupId?: string;
}) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      content,
      related_id: relatedId || null,
      group_id: groupId || null,
    });

    if (error) {
      console.error("Error creating notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error creating notification:", error);
    return false;
  }
}

/**
 * Creates expense added notifications for all group members except the expense creator
 */
export async function createExpenseAddedNotifications({
  groupId,
  groupName,
  expenseId,
  expenseAmount,
  expenseDescription,
  createdByUserId,
  createdByUserName,
}: {
  groupId: string;
  groupName: string;
  expenseId: string;
  expenseAmount: number;
  expenseDescription: string;
  createdByUserId: string;
  createdByUserName: string;
}) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Get all group members except the creator
    const { data: groupMembers, error: membersError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .neq("user_id", createdByUserId);

    if (membersError || !groupMembers) {
      console.error("Error fetching group members:", membersError);
      return false;
    }

    // Create a notification for each member
    const notifications = groupMembers.map((member) => ({
      user_id: member.user_id,
      type: "expense_added" as NotificationType,
      content: `${createdByUserName} added a new expense of ${formatCurrency(
        expenseAmount
      )} for "${expenseDescription}" in ${groupName}.`,
      related_id: expenseId,
      group_id: groupId,
    }));

    if (notifications.length > 0) {
      const { error } = await supabase
        .from("notifications")
        .insert(notifications);

      if (error) {
        console.error("Error creating expense notifications:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Unexpected error creating expense notifications:", error);
    return false;
  }
}

/**
 * Creates settlement request notifications
 */
export async function createSettlementRequestNotification({
  toUserId,
  fromUserName,
  amount,
  groupId,
  groupName,
}: {
  toUserId: string;
  fromUserName: string;
  amount: number;
  groupId: string;
  groupName: string;
}) {
  return createNotification({
    userId: toUserId,
    type: "settlement_request",
    content: `${fromUserName} has requested a settlement of ${formatCurrency(
      amount
    )} in ${groupName}.`,
    groupId,
  });
}

/**
 * Creates settlement completed notifications
 */
export async function createSettlementCompletedNotification({
  toUserId,
  fromUserId,
  settledByUserId,
  settledByUserName,
  amount,
  groupId,
  groupName,
  settlementId,
}: {
  toUserId: string;
  fromUserId: string;
  settledByUserId: string;
  settledByUserName: string;
  amount: number;
  groupId: string;
  groupName: string;
  settlementId: string;
}) {
  // Create notifications for both parties involved in the settlement
  // (unless they're the one who marked it as settled)
  const notifications = [];

  if (fromUserId !== settledByUserId) {
    notifications.push({
      userId: fromUserId,
      type: "settlement_completed" as NotificationType,
      content: `${settledByUserName} marked your payment of ${formatCurrency(
        amount
      )} as settled in ${groupName}.`,
      relatedId: settlementId,
      groupId,
    });
  }

  if (toUserId !== settledByUserId) {
    notifications.push({
      userId: toUserId,
      type: "settlement_completed" as NotificationType,
      content: `${settledByUserName} marked a payment of ${formatCurrency(
        amount
      )} to you as settled in ${groupName}.`,
      relatedId: settlementId,
      groupId,
    });
  }

  // Create all notifications
  const results = await Promise.all(
    notifications.map((notification) => createNotification(notification))
  );

  // Return true if all notifications were created successfully
  return results.every((result) => result);
}

/**
 * Creates group invitation notification
 */
export async function createGroupInvitationNotification({
  userId,
  inviterName,
  groupId,
  groupName,
}: {
  userId: string;
  inviterName: string;
  groupId: string;
  groupName: string;
}) {
  return createNotification({
    userId,
    type: "group_invitation",
    content: `${inviterName} has invited you to join the group "${groupName}".`,
    groupId,
  });
}
