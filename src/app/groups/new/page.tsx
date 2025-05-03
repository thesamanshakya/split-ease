'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error('You must be logged in to create a group');
      }

      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([
          {
            name,
            created_by: session.user.id
          }
        ])
        .select('id')
        .single();

      if (groupError) throw groupError;

      // Add the creator as a member of the group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: groupData.id,
            user_id: session.user.id
          }
        ]);

      if (memberError) throw memberError;

      // Redirect to the group page
      router.push(`/groups/${groupData.id}`);
    } catch (error: any) {
      setError(error.message || 'An error occurred while creating the group');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Group</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Group Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Weekend Trip, Roommates, Dinner Club"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Choose a name that describes your group's purpose
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
} 