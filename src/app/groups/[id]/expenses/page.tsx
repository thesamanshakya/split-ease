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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Expenses for {group?.name}</h1>
          <p className="text-gray-600">{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</p>
        </div>
        <Link
          href={`/groups/${groupId}`}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Back to Group
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">All Expenses</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="filterPaidBy" className="block text-sm font-medium text-gray-700 mb-1">
                Paid by
              </label>
              <select
                id="filterPaidBy"
                value={filterPaidBy}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="py-1 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All members</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => handleSortOrderChange(e.target.value as 'desc' | 'asc')}
                className="py-1 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
        </div>

        {expenses.length > 0 ? (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div 
                key={expense.id} 
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{expense.description}</h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(expense.date)} • Paid by {findUserName(expense.paid_by)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">{formatCurrency(expense.amount)}</p>
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
            <p>No expenses found.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end mb-8">
        <Link
          href={`/groups/${groupId}/expenses/new`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
        >
          Add New Expense
        </Link>
      </div>
    </div>
  );
} 