import Link from 'next/link';

export default function UserTile({ user }) {
  const isStudent = user.role === 'student';
  const identifier = isStudent ? user.registerNumber : user.staffId;
  const profileLink = isStudent ? `/profile/${user.registerNumber}` : '#';

  return (
    <div className="p-6">
      <div className="flex items-start">
        {/* Profile Picture */}
        <div className="flex-shrink-0 mr-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {user.profile?.profilePic && user.profile.profilePic !== '/placeholder.png' ? (
              <img 
                src={user.profile.profilePic} 
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-600 text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            {isStudent ? (
              <Link 
                href={profileLink}
                className="text-lg font-semibold text-gray-900 hover:text-emerald-600 truncate"
              >
                {user.name}
              </Link>
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {user.name}
              </h3>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mb-2">
            {identifier}
          </p>
          
          <div className="flex items-center flex-wrap gap-2">
            <span 
              className="inline-block px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: `${user.departmentColor || '#6b7280'}20`,
                color: user.departmentColor || '#6b7280'
              }}
            >
              {user.department}
            </span>
            
            {isStudent && user.batchYear && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                Batch {user.batchYear}
              </span>
            )}
          </div>
          
          {/* Additional Info */}
          {user.profile?.bio && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
              {user.profile.bio}
            </p>
          )}
          
          {/* Interests */}
          {user.profile?.interests && user.profile.interests.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {user.profile.interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {interest}
                  </span>
                ))}
                {user.profile.interests.length > 3 && (
                  <span className="inline-block text-gray-500 text-xs">
                    +{user.profile.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Joined Date */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          }) : 'Recently'}
        </p>
      </div>
    </div>
  );
}