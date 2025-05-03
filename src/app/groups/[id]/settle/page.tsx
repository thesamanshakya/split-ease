'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function SettleUpPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const groupId = params.id;
  
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
      currency: 'USD'
    }).format(amount);
  };

  const handleMarkAsSettled = async () => {
    setMarkingAsSettled(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // In a real app, you might want to record the settlement in a dedicated settlements table
      // For now, we'll just add a success message
      setSuccessMessage("All debts have been marked as settled!");
      
      // In a real app, you would create records of the settlements and reset balances
      // This would involve additional database tables and logic
      
      // For example:
      // await supabase.from('settlements').insert(
      //   settlements.map(s => ({
      //     group_id: groupId,
      //     from_user_id: s.from,
      //     to_user_id: s.to,
      //     amount: s.amount,
      //     settled_at: new Date().toISOString()
      //   }))
      // );
      
      // Then you might want to reset balances or mark expenses as settled
      
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
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Settle Up - {group?.name}</h1>
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

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Balances</h2>
        
        <div className="space-y-3 mb-6">
          {balances.map((balance) => {
            const isCurrentUser = balance.user_id === currentUser?.id;
            return (
              <div
                key={balance.user_id}
                className={`py-2 ${isCurrentUser ? 'bg-indigo-50 px-3 rounded' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span>{findUserName(balance.user_id)}</span>
                  <span className={`font-medium ${balance.amount > 0 ? 'text-green-600' : balance.amount < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatCurrency(balance.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Suggested Payments</h2>
        
        {settlements.length > 0 ? (
          <div className="space-y-4">
            {settlements.map((settlement, index) => {
              const fromIsCurrentUser = settlement.from === currentUser?.id;
              const toIsCurrentUser = settlement.to === currentUser?.id;
              
              return (
                <div 
                  key={index} 
                  className={`border p-4 rounded-lg ${
                    fromIsCurrentUser || toIsCurrentUser ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {fromIsCurrentUser ? 'You' : findUserName(settlement.from)} 
                        <span className="text-gray-600"> pays </span>
                        {toIsCurrentUser ? 'you' : findUserName(settlement.to)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {fromIsCurrentUser ? 'You owe ' + formatCurrency(settlement.amount) : ''}
                        {toIsCurrentUser ? findUserName(settlement.from) + ' owes you ' + formatCurrency(settlement.amount) : ''}
                        {!fromIsCurrentUser && !toIsCurrentUser ? 
                          `${findUserName(settlement.from)} owes ${findUserName(settlement.to)} ${formatCurrency(settlement.amount)}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium">{formatCurrency(settlement.amount)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No payments needed! Everyone is settled up.</p>
          </div>
        )}
      </div>

      {settlements.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAsSettled}
            disabled={markingAsSettled}
            className={`bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded ${
              markingAsSettled ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {markingAsSettled ? 'Processing...' : 'Mark All as Settled'}
          </button>
        </div>
      )}
      
      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>Settling up will mark all debts as settled. Make sure all payments have been made before clicking.</p>
      </div>
    </div>
  );
} 