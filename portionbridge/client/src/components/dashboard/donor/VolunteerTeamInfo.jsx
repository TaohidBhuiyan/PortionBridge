import { Users, Star, CheckCircle, Award } from 'lucide-react';

/**
 * Volunteer Team Information Component
 * Displays team details if volunteer belongs to a team
 */
const VolunteerTeamInfo = ({ team }) => {
  if (!team) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Team Information</h2>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">This volunteer is not part of a team</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Team Information</h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Team Icon */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Team Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {team.name}
          </h3>

          {team.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {team.description}
            </p>
          )}

          {/* Team Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Members</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {team.member_count}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>Role</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {team.team_role}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Completed</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                N/A
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Star className="w-3.5 h-3.5" />
                <span>Rating</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                N/A
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Leader Info */}
      <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-800">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Team Leader ID: {team.leader_id}</p>
      </div>
    </div>
  );
};

export default VolunteerTeamInfo;
