'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Expense, User } from '@/types';

export default function GroupExpensesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const groupId = params.id;
  
  const [group, setGroup] = useState<{ id: string; name: string } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterPaidBy, setFilterPaidBy] = useState<string>('');

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Check user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          router.push('/auth');
          return;
        }

        // Get group details
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('id, name')
          .eq('id', groupId)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        // Get group members
        const { data: groupMembersData, error: groupMembersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);

        if (groupMembersError) throw groupMembersError;

        if (groupMembersData && groupMembersData.length > 0) {
          const userIds = groupMembersData.map(member => member.user_id);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url')
            .in('id', userIds);

          if (profilesError) throw profilesError;
          setMembers(profilesData || []);
        }

        // Get all expenses for this group
        await fetchExpenses();
      } catch (error: any) {
        console.error('Error fetching group data:', error);
        setError(error.message || 'An error occurred while loading the group data');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, router]);

  const fetchExpenses = async () => {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: sortOrder === 'asc' });

      if (filterPaidBy) {
        query = query.eq('paid_by', filterPaidBy);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      setError(error.message || 'An error occurred while loading the expenses');
    }
  };

  const handleSortOrderChange = async (order: 'desc' | 'asc') => {
    setSortOrder(order);
    await fetchExpenses();
  };

  const handleFilterChange = async (userId: string) => {
    setFilterPaidBy(userId);
    await fetchExpenses();
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{group?.name} <span className="text-gray-500 font-normal">• Expenses</span></h1>
          <p className="text-gray-500">{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</p>
        </div>
        <Link
          href={`/groups/${groupId}`}
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Group
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">All Expenses</h2>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-auto">
              <label htmlFor="filterPaidBy" className="block text-sm font-medium text-gray-700 mb-1">
                Paid by
              </label>
              <select
                id="filterPaidBy"
                value={filterPaidBy}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full py-2 px-3 text-sm border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All members</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => handleSortOrderChange(e.target.value as 'desc' | 'asc')}
                className="w-full py-2 px-3 text-sm border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
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
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">{formatDate(expense.date)}</span>
                      <span className="mx-1.5 text-gray-400">•</span>
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-1 text-indigo-700 font-medium text-xs">
                          {findUserName(expense.paid_by).charAt(0)}
                        </div>
                        Paid by {findUserName(expense.paid_by)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">{formatCurrency(expense.amount)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                        expense.split_type === 'equal' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {expense.split_type === 'equal' ? 'Split equally' : 'Split manually'}
                      </span>
                    </div>
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
            <p className="mt-2 text-gray-500 font-medium">No expenses found.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/groups/${groupId}/expenses/new`}
            className="w-full bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-medium py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Expense
          </Link>
        </div>
      </div>
    </div>
  );
} 