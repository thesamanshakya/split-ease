'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Group, User, Expense, Balance } from '@/types';

export default function GroupPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groupId = params.id;

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          router.push('/auth');
          return;
        }

        // Get user profile
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setCurrentUser(userData);

        // Get group details
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        // Get group members - two step approach
        const { data: groupMembersData, error: groupMembersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);

        if (groupMembersError) throw groupMembersError;

        // Get user profiles for each member
        if (groupMembersData && groupMembersData.length > 0) {
          const userIds = groupMembersData.map(member => member.user_id);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url')
            .in('id', userIds);

          if (profilesError) throw profilesError;
          setMembers(profilesData || []);
        } else {
          setMembers([]);
        }

        // Get group expenses
        const { data: expenseData, error: expenseError } = await supabase
          .from('expenses')
          .select('*')
          .eq('group_id', groupId)
          .order('date', { ascending: false });

        if (expenseError) throw expenseError;
        setExpenses(expenseData || []);

        // Calculate balances
        // This is a simplified calculation. In a real app, you would need to
        // calculate this based on the actual expense splits.
        if (expenseData && members.length > 0) {
          const balanceMap = new Map<string, number>();

          // Initialize balances for all members
          members.forEach(member => {
            balanceMap.set(member.id, 0);
          });

          // Calculate balances based on expenses
          expenseData.forEach(expense => {
            const paidBy = expense.paid_by;
            const splitAmount = expense.amount / members.length;

            // Add the full amount to the person who paid
            balanceMap.set(paidBy, (balanceMap.get(paidBy) || 0) + expense.amount);

            // Subtract the split amount from each member (including the payer)
            members.forEach(member => {
              balanceMap.set(member.id, (balanceMap.get(member.id) || 0) - splitAmount);
            });
          });

          // Convert the map to an array of Balance objects
          const balanceArray: Balance[] = Array.from(balanceMap).map(([user_id, amount]) => ({
            user_id,
            amount
          }));

          setBalances(balanceArray);
        }
      } catch (error: any) {
        console.error('Error fetching group data:', error);
        setError(error.message || 'An error occurred while loading the group');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, router]);

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
        {error || 'Group not found'}
      </div>
    );
  }

  const findUserName = (userId: string) => {
    const member = members.find(m => m.id === userId);
    return member ? member.name : 'Unknown User';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-gray-600">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        </div>
        <Link
          href={`/groups/${groupId}/expenses/new`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
        >
          Add Expense
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
          <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>

          {expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{expense.description}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(expense.date)} • Paid by {findUserName(expense.paid_by)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(expense.amount)}</p>
                      <p className="text-sm text-gray-600">
                        {expense.split_type === 'equal' ? 'Split equally' : 'Split manually'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No expenses yet. Add your first expense!</p>
            </div>
          )}

          {expenses.length > 0 && (
            <div className="mt-4 text-right">
              <Link
                href={`/groups/${groupId}/expenses`}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View all expenses →
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Balances</h2>

          {balances.length > 0 ? (
            <div className="space-y-3">
              {balances.map((balance) => {
                const isCurrentUser = balance.user_id === currentUser?.id;
                const formattedAmount = formatCurrency(Math.abs(balance.amount));
                let statusText = '';
                let statusClass = '';

                if (balance.amount > 0) {
                  statusText = isCurrentUser
                    ? `You are owed ${formattedAmount}`
                    : `${findUserName(balance.user_id)} is owed ${formattedAmount}`;
                  statusClass = 'text-green-600';
                } else if (balance.amount < 0) {
                  statusText = isCurrentUser
                    ? `You owe ${formattedAmount}`
                    : `${findUserName(balance.user_id)} owes ${formattedAmount}`;
                  statusClass = 'text-red-600';
                } else {
                  statusText = isCurrentUser
                    ? `You are settled up`
                    : `${findUserName(balance.user_id)} is settled up`;
                  statusClass = 'text-gray-600';
                }

                return (
                  <div
                    key={balance.user_id}
                    className={`py-2 ${isCurrentUser ? 'bg-indigo-50 px-3 rounded' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{findUserName(balance.user_id)}</span>
                      <span className={statusClass}>
                        {balance.amount === 0
                          ? 'Settled'
                          : formatCurrency(balance.amount)
                        }
                      </span>
                    </div>
                    <p className="text-xs mt-1">{statusText}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No balances to show.</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link
              href={`/groups/${groupId}/settle`}
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded text-center"
            >
              Settle Up
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Group Members</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <span className="text-indigo-700 font-medium">
                    {member.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/groups/${groupId}/invite`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite People
          </Link>
        </div>
      </div>
    </div>
  );
} 