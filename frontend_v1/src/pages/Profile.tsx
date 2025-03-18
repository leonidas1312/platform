import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Settings, Loader2, FolderGit, FileCog2 } from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';
import Layout from '../components/Layout';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reposLoading, setReposLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          headers: { Authorization: `token ${token}` },
        });
        if (!response.ok) {
          navigate('/auth');
          return;
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    // Fetch user repositories
    const fetchUserRepos = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/user-repos', {
          headers: { Authorization: `token ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
        <span className="ml-2 text-gray-600">Loading Profile...</span>
      </div>
    );
  }

  if (!user) return null;

  // Function to handle repo card clicks and redirect to the repo page
  const handleRepoClick = (repo) => {
    // Expecting repo.full_name in "owner/repo" format
    const [ownerName] = repo.full_name.split("/");
    const repoName = repo.name;
    navigate(`/${ownerName}/${repoName}`);
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveChanges = async (updatedData) => {
    try {
      const token = localStorage.getItem('gitea_token');
      if (!token) {
        toast({ title: 'Error', description: 'No token found. Please re-authenticate.' });
        return;
      }

      const patchResponse = await fetch('http://localhost:4000/api/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!patchResponse.ok) {
        const errData = await patchResponse.json();
        throw new Error(errData.message || 'Failed to update profile');
      }

      // Re-fetch updated profile data
      const getResponse = await fetch('http://localhost:4000/api/profile', {
        headers: { Authorization: `token ${token}` },
      });
      if (!getResponse.ok) {
        throw new Error('Failed to fetch updated profile');
      }
      const newUser = await getResponse.json();

      setUser(newUser);
      toast({ title: 'Success', description: 'Profile updated successfully!' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: error.message });
    }
  };

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4 space-y-12">
          {/* Profile Header */}
          <section className="bg-white p-8 rounded-xl shadow-md transition transform hover:scale-105">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img
                src={user.avatar_url}
                alt="Profile Avatar"
                className="w-28 h-28 rounded-full border-4 border-indigo-500 object-cover"
              />
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900">{user.full_name || user.login}</h1>
                <p className="text-gray-600">@{user.login}</p>
                <p className="mt-2 text-sm text-gray-500">{user.email || 'No email provided'}</p>
                <div className="mt-4">
                  <Button onClick={handleOpenModal} className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <p className="text-sm text-gray-500">Followers</p>
              <p className="text-2xl font-bold mt-2 text-gray-800">{user.followers_count}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <p className="text-sm text-gray-500">Following</p>
              <p className="text-2xl font-bold mt-2 text-gray-800">{user.following_count}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <p className="text-sm text-gray-500">Starred</p>
              <p className="text-2xl font-bold mt-2 text-gray-800">{user.starred_repos_count}</p>
            </div>
          </section>

          {/* About Section */}
          <section className="bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">About</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                <p className="text-gray-800">{user.full_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Location</label>
                <p className="text-gray-800">{user.location || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Website</label>
                <p className="text-gray-800">{user.website || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Visibility</label>
                <p className="text-gray-800">{user.visibility || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm text-gray-500 mb-1">Bio / Description</label>
              <p className="text-gray-800">{user.description || 'No description provided.'}</p>
            </div>
          </section>

          {/* Repositories Section */}
          <section className="bg-white p-8 rounded-xl shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <FolderGit className="w-5 h-5 text-gray-700" />
              <h2 className="text-2xl font-bold text-gray-900">My Repositories</h2>
            </div>
            {reposLoading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
                <span className="ml-2 text-gray-600">Loading Repositories...</span>
              </div>
            ) : repos.length > 0 ? (
              <div className="space-y-4">
                {repos.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => handleRepoClick(repo)}
                    className="cursor-pointer border border-gray-200 p-4 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold flex items-center gap-2 text-gray-800">
                      <FileCog2 className="w-4 h-4" /> {repo.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No repositories found.</p>
            )}
          </section>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={user}
        onSave={handleSaveChanges}
      />
    </Layout>
  );
};

export default Profile;
