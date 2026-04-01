import Link from 'next/link';

export default function UserTile({ user }) {
  const isStudent = user.role === 'student';
  const identifier = isStudent ? user.registerNumber : user.staffId;
  const profileLink = isStudent ? `/profile/${user.registerNumber}` : '#';

  const departmentColor = user.departmentColor || '#7C5CFF';
  const roleColor = isStudent ? '#22C55E' : '#F59E0B';

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* Profile Picture */}
        <div style={{ flexShrink: 0, marginRight: '1rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#171B24',
              border: '1px solid #222634',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {user.profile?.profilePic && user.profile.profilePic !== '/placeholder.png' ? (
              <img
                src={user.profile.profilePic}
                alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 24, fontWeight: 700, color: '#7C5CFF' }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* User Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            {isStudent ? (
              <Link
                href={profileLink}
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#E5E7EB',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => (e.target.style.color = '#7C5CFF')}
                onMouseOut={(e) => (e.target.style.color = '#E5E7EB')}
              >
                {user.name}
              </Link>
            ) : (
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#E5E7EB',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </h3>
            )}
          </div>

          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
            {identifier}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 20,
                background: `${departmentColor}20`,
                border: `1px solid ${departmentColor}40`,
                color: departmentColor,
              }}
            >
              {user.department}
            </span>

            {isStudent && user.batchYear && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 20,
                  background: '#171B24',
                  border: '1px solid #222634',
                  color: '#9CA3AF',
                }}
              >
                Batch {user.batchYear}
              </span>
            )}
          </div>

          {/* Additional Info */}
          {user.profile?.bio && (
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: '#9CA3AF',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.profile.bio}
            </p>
          )}

          {/* Interests */}
          {user.profile?.interests && user.profile.interests.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {user.profile.interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-block',
                      background: '#171B24',
                      border: '1px solid #222634',
                      color: '#9CA3AF',
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    {interest}
                  </span>
                ))}
                {user.profile.interests.length > 3 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: '#6B7280',
                    }}
                  >
                    +{user.profile.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Joined Date */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid #222634',
        }}
      >
        <p style={{ fontSize: 10, color: '#6B7280' }}>
          Joined{' '}
          {user.createdAt
            ? new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })
            : 'Recently'}
        </p>
      </div>
    </div>
  );
}