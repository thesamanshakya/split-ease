'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { User } from '@/types';

export default function NewExpensePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const groupId = params.id;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'manual'>('equal');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [members, setMembers] = useState<User[]>([]);
  const [splits, setSplits] = useState<{ userId: string; amount: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchGroupMembers = async () => {
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
        setPaidBy(session.user.id);

        // Get group members
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select(`
            user_id,
            profiles:user_id (
              id,
              name,
              email,
              avatar_url
            )
          `)
          .eq('group_id', groupId);

        if (memberError) throw memberError;

        const formattedMembers = memberData.map(item => item.profiles) as unknown as User[];
        setMembers(formattedMembers);

        // Initialize empty splits for all members
        const initialSplits = formattedMembers.map(member => ({
          userId: member.id,
          amount: ''
        }));
        setSplits(initialSplits);
      } catch (error: any) {
        console.error('Error fetching group members:', error);
        setError(error.message || 'An error occurred while loading group members');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupMembers();
  }, [groupId, router]);

  const updateSplits = (newAmount: string) => {
    if (splitType === 'equal' && members.length > 0) {
      const numericAmount = parseFloat(newAmount || '0');
      if (!isNaN(numericAmount)) {
        const perPersonAmount = (numericAmount / members.length).toFixed(2);
        const newSplits = members.map(member => ({
          userId: member.id,
          amount: perPersonAmount
        }));
        setSplits(newSplits);
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    updateSplits(newAmount);
  };

  const handleSplitTypeChange = (type: 'equal' | 'manual') => {
    setSplitType(type);
    if (type === 'equal') {
      updateSplits(amount);
    }
  };

  const handleSplitAmountChange = (userId: string, splitAmount: string) => {
    const newSplits = splits.map(split =>
      split.userId === userId ? { ...split, amount: splitAmount } : split
    );
    setSplits(newSplits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate the total split amount equals the expense amount
      if (splitType === 'manual') {
        const totalSplitAmount = splits.reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0);
        const expenseAmount = parseFloat(amount);

        if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
          throw new Error(`The split amounts total (${totalSplitAmount.toFixed(2)}) must equal the expense amount (${expenseAmount.toFixed(2)})`);
        }
      }

      // Create the expense
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert([
          {
            group_id: groupId,
            description,
            amount: parseFloat(amount),
            paid_by: paidBy,
            date,
            split_type: splitType,
            created_at: new Date().toISOString()
          }
        ])
        .select('id')
        .single();

      if (expenseError) throw expenseError;

      // Create the expense splits
      const expenseSplits = splits.map(split => ({
        expense_id: expenseData.id,
        user_id: split.userId,
        amount: parseFloat(split.amount || '0')
      }));

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(expenseSplits);

      if (splitsError) throw splitsError;

      // Redirect back to the group page
      router.push(`/groups/${groupId}`);
    } catch (error: any) {
      setError(error.message || 'An error occurred while creating the expense');
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Expense</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 mb-2">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner at Italian Restaurant"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 mb-2">
              Total Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                required
                className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="date" className="block text-gray-700 mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="paidBy" className="block text-gray-700 mb-2">
              Paid By
            </label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select who paid</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} {member.id === currentUser?.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Split Type</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="equal"
                  checked={splitType === 'equal'}
                  onChange={() => handleSplitTypeChange('equal')}
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Split equally</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={splitType === 'manual'}
                  onChange={() => handleSplitTypeChange('manual')}
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Split manually</span>
              </label>
            </div>
          </div>

          {splitType === 'manual' && (
            <div className="mb-6 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium mb-2">Custom Split</h3>
              <p className="text-sm text-gray-600 mb-4">
                Specify how much each person owes. The total should equal ${amount || '0.00'}.
              </p>

              <div className="space-y-3">
                {splits.map((split, index) => {
                  const member = members.find(m => m.id === split.userId);
                  return (
                    <div key={split.userId} className="flex items-center">
                      <div className="w-1/2">
                        <span>{member?.name} {member?.id === currentUser?.id ? '(You)' : ''}</span>
                      </div>
                      <div className="w-1/2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={split.amount}
                            onChange={(e) => handleSplitAmountChange(split.userId, e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 ${submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 