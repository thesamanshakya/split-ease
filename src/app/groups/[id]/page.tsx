'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Group, User, Expense, Balance } from '@/types';
import Image from 'next/image';

export default function GroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to calculate balances from expenses and members
  const calculateBalances = (members: User[], expenses: Expense[]): Balance[] => {
    const balanceMap = new Map<string, number>();

    // Initialize balances for all members
    members.forEach(member => {
      balanceMap.set(member.id, 0);
    });

    // Calculate balances based on expenses
    expenses.forEach(expense => {
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
    return Array.from(balanceMap).map(([user_id, amount]) => ({
      user_id,
      amount
    }));
  };

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

        // Calculate balances if we have both members and expenses
        if (members.length > 0 && expenseData) {
          const calculatedBalances = calculateBalances(members, expenseData);
          setBalances(calculatedBalances);
        }
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('Error fetching group data:', error);
        setError(error.message || 'An error occurred while loading the group');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, router, members]);

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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
          <p className="text-gray-500">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        </div>
        <Link
          href={`/groups/${groupId}/expenses/new`}
          className="bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-medium py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Expense
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Expenses</h2>
            {expenses.length > 0 && (
              <Link
                href={`/groups/${groupId}/expenses`}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
              >
                View all
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                      <h3 className="font-medium text-gray-800">{expense.description}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatDate(expense.date)} • Paid by {findUserName(expense.paid_by)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatCurrency(expense.amount)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {expense.split_type === 'equal' ? 'Split equally' : 'Split manually'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-gray-500 font-medium">No expenses yet. Add your first expense!</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Balances</h2>

          {balances.length > 0 ? (
            <div className="space-y-2">
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
                    className={`py-3 px-4 rounded-xl ${isCurrentUser ? 'bg-indigo-50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-700 font-medium text-sm">
                          {findUserName(balance.user_id).charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800 truncate">{findUserName(balance.user_id)}</span>
                      </div>
                      <span className={`font-medium ${balance.amount === 0 ? 'text-gray-600' : balance.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {balance.amount === 0 ? 'Settled' : formatCurrency(balance.amount)}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 pl-11 ${statusClass}`}>{statusText}</p>
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

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Group Members</h2>
          <Link
            href={`/groups/${groupId}/invite`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite People
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
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
                <div className="text-xs text-gray-500">{member.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 