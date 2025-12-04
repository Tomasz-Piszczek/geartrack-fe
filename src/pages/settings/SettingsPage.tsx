import React, { useState, useEffect } from 'react';
import { HiAdjustments, HiCog, HiUser, HiLockClosed, HiPlus, HiTrash } from 'react-icons/hi';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAuth } from '../../context/AuthContext';
import { organizationsApi } from '../../api/organizations';
import type { UserDto, AssignUserRequest } from '../../types';

const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [organizationUsers, setOrganizationUsers] = useState<UserDto[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'USER' | 'SUPER_USER'>('USER');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAdmin() && user?.organization?.id) {
      fetchOrganizationUsers();
    }
  }, [user?.organization?.id, isAdmin]);

  const fetchOrganizationUsers = async () => {
    if (!user?.organization?.id) return;
    
    try {
      const organization = await organizationsApi.getOrganizationById(user.organization.id);
      setOrganizationUsers(organization.users || []);
    } catch (error) {
      console.error('Failed to fetch organization users:', error);
    }
  };

  const handleAddUser = async () => {
    if (!user?.organization?.id || !newUserEmail) return;

    setIsLoading(true);
    try {
      const request: AssignUserRequest = {
        userEmail: newUserEmail,
        organizationId: user.organization.id,
        role: newUserRole,
      };
      await organizationsApi.assignUserToOrganization(request);
      await fetchOrganizationUsers();
      setShowAddUserModal(false);
      setNewUserEmail('');
      setNewUserRole('USER');
    } catch (error) {
      console.error('Failed to add user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      await organizationsApi.removeUserFromOrganization(selectedUser.email);
      await fetchOrganizationUsers();
      setShowDeleteUserModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const settingsCategories = [
    {
      title: 'Ustawienia profilu',
      description: 'Zarządzaj informacjami o koncie i preferencjami',
      icon: HiUser,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      comingSoon: true,
    },
    {
      title: 'Konfiguracja systemu',
      description: 'Konfiguruj ustawienia systemowe i preferencje',
      icon: HiCog,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      comingSoon: true,
    },
    {
      title: 'Ustawienia bezpieczeństwa',
      description: 'Zarządzaj uwierzytelnianiem i opcjami bezpieczeństwa',
      icon: HiLockClosed,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      comingSoon: true,
    },
  ];

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {user?.organization?.organizationName || 'Ustawienia'}
        </h1>
        <p className="text-surface-grey-dark">
          {user?.organization?.organizationName 
            ? `Ustawienia organizacji ${user.organization.organizationName}` 
            : 'Skonfiguruj aplikację GearTrack'
          }
        </p>
      </div>

      {/* Organization Users Management - Only for admins */}
      {isAdmin() && user?.organization && (
        <Card className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Użytkownicy organizacji</h2>
              <p className="text-surface-grey-dark">Zarządzaj użytkownikami w Twojej organizacji</p>
            </div>
            <Button 
              onClick={() => setShowAddUserModal(true)}
              className="bg-main hover:bg-main-dark text-black"
            >
              <HiPlus className="w-4 h-4 mr-2" />
              Dodaj użytkownika
            </Button>
          </div>

          {organizationUsers.length > 0 ? (
            <div className="space-y-3">
              {organizationUsers.map((orgUser) => (
                <div key={orgUser.userId} className="flex items-center justify-between p-4 bg-background-card rounded-lg">
                  <div>
                    <p className="text-white font-medium">{orgUser.email}</p>
                    <p className="text-surface-grey-dark text-sm">
                      Rola: {orgUser.role === 'ADMIN' ? 'Administrator' : 
                            orgUser.role === 'SUPER_USER' ? 'Super użytkownik' : 'Użytkownik'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => {
                        setSelectedUser(orgUser);
                        setShowDeleteUserModal(true);
                      }}
                      color="gray"
                      size="sm"
                      disabled={orgUser.userId === user.userId}
                    >
                      <HiTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-surface-grey-dark">
              <HiUser className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Brak użytkowników w organizacji</p>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCategories.map((category, index) => (
          <Card key={index} className="card hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${category.bgColor}`}>
                <category.icon className={`w-6 h-6 ${category.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                  {category.comingSoon && (
                    <span className="badge badge-info text-xs">Wkrótce</span>
                  )}
                </div>
                <p className="text-surface-grey-dark text-sm">{category.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!isAdmin() && (
        <Card className="card mt-8">
          <div className="text-center py-8">
            <HiAdjustments className="w-16 h-16 mx-auto mb-4 text-surface-grey-dark opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">Ustawienia wkrótce</h3>
            <p className="text-surface-grey-dark">
              Pracujemy nad kompleksowymi ustawieniami, aby dostosować Twoje doświadczenie z GearTrack.
            </p>
            <p className="text-surface-grey-dark mt-2">
              Sprawdź ponownie wkrótce!
            </p>
          </div>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal 
        show={showAddUserModal} 
        onClose={() => setShowAddUserModal(false)}
      >
        <Modal.Header>
          Dodaj użytkownika
        </Modal.Header>
        <Modal.Body>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-grey-light mb-2">
              Email użytkownika
            </label>
            <Input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-grey-light mb-2">
              Rola
            </label>
            <Select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'USER' | 'SUPER_USER')}
              className="w-full"
            >
              <option value="USER">Użytkownik</option>
              <option value="SUPER_USER">Super użytkownik</option>
              <option value="ADMIN">Administrator</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              color="gray"
              onClick={() => setShowAddUserModal(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button 
              onClick={handleAddUser}
              disabled={!newUserEmail || isLoading}
              className="bg-main hover:bg-main-dark text-black"
            >
              {isLoading ? 'Dodawanie...' : 'Dodaj użytkownika'}
            </Button>
          </div>
        </div>
        </Modal.Body>
      </Modal>

      {/* Delete User Modal */}
      <Modal 
        show={showDeleteUserModal} 
        onClose={() => setShowDeleteUserModal(false)}
      >
        <Modal.Header>
          Usuń użytkownika
        </Modal.Header>
        <Modal.Body>
        <div className="space-y-4">
          <p className="text-surface-grey-light">
            Czy na pewno chcesz usunąć użytkownika <strong>{selectedUser?.email}</strong> z organizacji?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              color="gray"
              onClick={() => setShowDeleteUserModal(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button 
              onClick={handleDeleteUser}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoading ? 'Usuwanie...' : 'Usuń użytkownika'}
            </Button>
          </div>
        </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SettingsPage;