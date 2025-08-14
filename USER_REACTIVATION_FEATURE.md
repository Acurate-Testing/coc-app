# User Reactivation Feature

## Overview
This feature allows administrators to reactivate deleted users in the water sampling application. When users are deleted, they are soft-deleted (marked with `deleted_at` timestamp) and can be reactivated by administrators.

## Implementation Details

### Database Changes
- Users are soft-deleted by setting `deleted_at` timestamp
- Reactivation clears the `deleted_at` field and sets `active: true`
- All user data is preserved during deletion/reactivation

### Supabase Auth Integration
- When users are deleted, their Supabase Auth metadata is updated with `deleted: true`
- When users are reactivated, their Supabase Auth metadata is updated with `deleted: false`
- This ensures consistency between database and authentication system

### API Endpoints

#### GET `/api/admin/users`
- Now returns all users (including deleted ones)
- Deleted users are ordered last in the list
- Includes `deleted_at` field in response

#### PATCH `/api/admin/users`
- New reactivation endpoint: `{ action: "reactivate", userId: "..." }`
- Handles both reactivation and existing test group assignment logic

#### DELETE `/api/admin/users/[id]`
- Updated to mark users as deleted in Supabase Auth metadata
- Maintains existing soft-delete functionality

### UI Changes

#### Admin Users Page (`/admin-dashboard/users`)
- **Filter Controls**: Toggle between Active, Deleted, and All users
- **User List**: 
  - Deleted users are visually distinguished with red styling and "Deleted" badges
  - Pagination support (20 users per page)
  - Search functionality works across all filters
- **User Details**: Shows deletion status and date
- **Actions**: 
  - Active users: "Delete User" button
  - Deleted users: "Reactivate User" button
- **Confirmation Modals**: Separate modals for deletion and reactivation
- **Status Summary**: Shows current filter and result count

### Security Considerations
- Only administrators can reactivate users
- Reactivation restores full user access
- Supabase Auth metadata is updated to reflect user status
- All operations are logged and can be audited

### Error Handling
- Graceful handling of Supabase Auth errors (doesn't fail entire operation)
- Clear error messages for users
- Proper validation of user existence and deletion status

## Usage

### For Administrators
1. Navigate to Admin Dashboard → Users
2. Use the filter controls to switch between Active, Deleted, and All users
3. Search for specific users using the search bar
4. Navigate through pages using pagination controls
5. Select a deleted user to view details
6. Click "Reactivate User" button
7. Confirm reactivation in the modal
8. User is restored and can log in again

### Technical Notes
- Reactivation preserves all user data and relationships
- Test group assignments are maintained
- Account access is restored
- User can immediately log in after reactivation

## Future Enhancements
- Bulk reactivation for multiple users
- Reactivation history/audit trail
- Email notifications to reactivated users
- Temporary suspension vs permanent deletion options
