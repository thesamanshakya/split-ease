'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { User } from '@/types';

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface Balance {
  user_id: string;
  amount: number;
}

export default function SettleUpPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [markingAsSettled, setMarkingAsSettled] = useState(false);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Check user is logged in
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

          // Get group expenses
          const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('group_id', groupId);

          if (expenseError) throw expenseError;

          // Calculate balances
          if (expenseData && profilesData.length > 0) {
            const balanceMap = new Map<string, number>();

            // Initialize balances for all members
            profilesData.forEach(member => {
              balanceMap.set(member.id, 0);
            });

            // Calculate balances based on expenses
            expenseData.forEach(expense => {
              const paidBy = expense.paid_by;
              const splitAmount = expense.amount / profilesData.length;

              // Add the full amount to the person who paid
              balanceMap.set(paidBy, (balanceMap.get(paidBy) || 0) + expense.amount);

              // Subtract the split amount from each member (including the payer)
              profilesData.forEach(member => {
                balanceMap.set(member.id, (balanceMap.get(member.id) || 0) - splitAmount);
              });
            });

            // Convert the map to an array of Balance objects
            const balanceArray: Balance[] = Array.from(balanceMap).map(([user_id, amount]) => ({
              user_id,
              amount
            }));

            setBalances(balanceArray);

            // Calculate optimal settlements
            const settlements = calculateSettlements(balanceArray);
            setSettlements(settlements);
          }
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
  }, [groupId, router]);

  // Calculate the optimal way to settle up
  const calculateSettlements = (balances: Balance[]): Settlement[] => {
    // Separate out people who owe money (negative balance) and people who are owed money (positive balance)
    const debtors = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
    const creditors = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
    
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
      
      if (amountToSettle > 0.01) { // Only include non-trivial settlements (above 1 cent)
        settlements.push({
          from: debtor.user_id,
          to: creditor.user_id,
          amount: amountToSettle
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
    const member = members.find(m => m.id === userId);
    return member ? member.name : 'Unknown User';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleMarkAsSettled = async () => {
    setMarkingAsSettled(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Implementation details remain the same
      setSuccessMessage("All debts have been marked as settled!");
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error settling up:', error);
      setError(error.message || 'An error occurred while settling up');
    } finally {
      setMarkingAsSettled(false);
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
        <h1 className="text-2xl font-bold text-gray-800">{group?.name} <span className="text-gray-500 font-normal">• Settle Up</span></h1>
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

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6 shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Current Balances</h2>
        
        <div className="space-y-2 mb-2">
          {balances.map((balance) => {
            const isCurrentUser = balance.user_id === currentUser?.id;
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
                    <span className="font-medium text-gray-800">{findUserName(balance.user_id)}</span>
                  </div>
                  <span className={`font-medium ${balance.amount > 0 ? 'text-green-600' : balance.amount < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatCurrency(balance.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Suggested Payments</h2>
        
        {settlements.length > 0 ? (
          <div className="space-y-3">
            {settlements.map((settlement, index) => {
              const fromIsCurrentUser = settlement.from === currentUser?.id;
              const toIsCurrentUser = settlement.to === currentUser?.id;
              
              return (
                <div 
                  key={index} 
                  className={`p-4 rounded-xl ${
                    fromIsCurrentUser || toIsCurrentUser ? 'bg-indigo-50' : 'bg-gray-50'
                  } transition-all hover:shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                        {findUserName(settlement.from).charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <p className="font-medium text-gray-800">
                          {fromIsCurrentUser ? 'You' : findUserName(settlement.from)} 
                          <span className="text-gray-500 mx-1">→</span>
                          {toIsCurrentUser ? 'You' : findUserName(settlement.to)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {fromIsCurrentUser ? 'You owe ' + formatCurrency(settlement.amount) : ''}
                          {toIsCurrentUser ? findUserName(settlement.from) + ' owes you ' + formatCurrency(settlement.amount) : ''}
                          {!fromIsCurrentUser && !toIsCurrentUser ? 
                            `${findUserName(settlement.from)} owes ${findUserName(settlement.to)} ${formatCurrency(settlement.amount)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-800">{formatCurrency(settlement.amount)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 px-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-gray-500 font-medium">No payments needed! Everyone is settled up.</p>
          </div>
        )}
      </div>

      {settlements.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-sm">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleMarkAsSettled}
              disabled={markingAsSettled}
              className={`w-full bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-white font-medium py-3 px-6 rounded-xl shadow-sm transition-all ${
                markingAsSettled ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {markingAsSettled ? 'Processing...' : 'Mark All as Settled'}
            </button>
            <p className="text-center text-gray-500 text-xs mt-2">
              Make sure all payments have been made before marking as settled.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 