import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { User, Settings, FolderGit, FileCog2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from "../components/Layout";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reposLoading, setReposLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('gitea_token');
    if (!token) {
      navigate('/auth');
      return;
    }

    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/profile', {
          headers: { 'Authorization': `token ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    // Fetch repositories
    const fetchUserRepos = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/user-repos', {
          headers: {
            'Authorization': `token ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
        } else {
          console.error('Failed to fetch repos');
        }
      } catch (error) {
        console.error('Failed to fetch repos', error);
      } finally {
        setReposLoading(false);
      }
    };

    fetchUserProfile();
    fetchUserRepos();
  }, [navigate]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const handleUpdateProfile = () => {
    toast({ title: 'Info', description: 'Profile editing is not yet implemented.' });
  };

  return (
    <Layout>

      <div className="container mx-auto px-4 py-32">
        <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          {/* Profile Header */}
          <div className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 bg-white p-6 rounded-lg shadow">
            <img
              src={user.avatar_url}
              alt="Profile Avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="flex-1 space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold">{user.full_name || user.login}</h1>
              <p className="text-gray-600">@{user.login}</p>
              <p className="text-sm text-gray-500">{user.email || 'No email provided'}</p>
              <div className="flex gap-3 mt-2">
                <Button onClick={handleUpdateProfile} className="flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Followers</p>
              <p className="text-xl font-bold">{user.followers_count}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Following</p>
              <p className="text-xl font-bold">{user.following_count}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Starred</p>
              <p className="text-xl font-bold">{user.starred_repos_count}</p>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">About</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                <p className="text-sm text-gray-800">{user.full_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Location</label>
                <p className="text-sm text-gray-800">{user.location || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Website</label>
                <p className="text-sm text-gray-800">{user.website || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Visibility</label>
                <p className="text-sm text-gray-800">{user.visibility || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm text-gray-500 mb-1">Bio / Description</label>
              <p className="text-sm text-gray-800">{user.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* Repositories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FolderGit className="w-5 h-5" /> My Repositories
            </h2>
            {reposLoading ? (
              <p>Loading Repositories...</p>
            ) : repos.length > 0 ? (
              <div className="flex flex-col gap-4">
                {repos.map((repo) => (
                  <div key={repo.id} className="border p-4 rounded-lg">
                    <h3 className="font-semibold mb-1 flex items-center gap-1">
                      <FileCog2 className="w-4 h-4" /> {repo.name}
                    </h3>
                    <p className="text-sm text-gray-600">{repo.description || 'No description provided.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No repositories found.</p>
            )}
          </div>
        </div>
      </div>
      </div>

      
    </Layout>
  );
};

export default Profile;
