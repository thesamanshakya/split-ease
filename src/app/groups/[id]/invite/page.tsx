'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { User } from '@/types';

export default function InvitePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const groupId = params.id;
  
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState<{ id: string; name: string } | null>(null);
  const [currentMembers, setCurrentMembers] = useState<User[]>([]);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

        // Get current members
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
          setCurrentMembers(profilesData || []);
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if the email is already a member
      const existingMember = currentMembers.find(member => 
        member.email.toLowerCase() === email.toLowerCase()
      );

      if (existingMember) {
        setError(`${email} is already a member of this group`);
        setInviting(false);
        return;
      }

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          setError(`No user found with email ${email}. They need to sign up first.`);
        } else {
          throw userError;
        }
        setInviting(false);
        return;
      }

      // Add user to the group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userData.id
        });

      if (memberError) throw memberError;

      setSuccess(`${email} has been added to the group!`);
      setEmail('');
      
      // Add the new member to the current members list
      const { data: newMemberData } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .eq('id', userData.id)
        .single();
        
      if (newMemberData) {
        setCurrentMembers([...currentMembers, newMemberData]);
      }
    } catch (error: any) {
      console.error('Error inviting member:', error);
      setError(error.message || 'An error occurred while inviting the member');
    } finally {
      setInviting(false);
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
      <h1 className="text-2xl font-bold mb-6">Invite People to {group?.name}</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleInvite}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={inviting}
              className={`bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 ${
                inviting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Current Members</h2>
        
        {currentMembers.length > 0 ? (
          <div className="space-y-4">
            {currentMembers.map((member) => (
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
                      {member.name?.charAt(0) || member.email?.charAt(0)}
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
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No members in this group yet.</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Back to Group
          </button>
        </div>
      </div>
    </div>
  );
} 