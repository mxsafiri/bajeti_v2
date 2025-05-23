'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  User, 
  Bell, 
  Lock, 
  Globe, 
  CreditCard,
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-supabase-data';
import { User as UserType } from '@/types/database';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase-client';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { data: currentUser, isLoading, error } = useCurrentUser();
  
  interface SettingsFormData extends Partial<UserType> {
    phone?: string | null; // Match UserType
    language?: string | null; // Match UserType
    currency?: string | null; // Match UserType
    email_notifications?: boolean | null; // Match UserType
    push_notifications?: boolean | null; // Match UserType
    sms_notifications?: boolean | null; // Match UserType
    theme?: 'light' | 'dark' | 'system' | null; // Added
  }

  const [formData, setFormData] = useState<SettingsFormData>({
    full_name: '',
    email: '',
    avatar_url: '',
    phone: '',
    language: 'English',
    currency: 'TZS', // Default, will be overridden by currentUser if set
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    theme: 'system' // Default theme
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Update form data when user data is loaded
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev, // Keep any previous form state (e.g., if user started typing before load)
        full_name: currentUser.full_name || prev.full_name || '',
        email: currentUser.email || prev.email || '',
        avatar_url: currentUser.avatar_url || prev.avatar_url || '',
        phone: currentUser.phone || prev.phone || '',
        language: currentUser.language || prev.language || 'English',
        currency: currentUser.currency || prev.currency || 'TZS', // Currency can now come from DB
        email_notifications: currentUser.email_notifications !== undefined && currentUser.email_notifications !== null ? currentUser.email_notifications : prev.email_notifications,
        push_notifications: currentUser.push_notifications !== undefined && currentUser.push_notifications !== null ? currentUser.push_notifications : prev.push_notifications,
        sms_notifications: currentUser.sms_notifications !== undefined && currentUser.sms_notifications !== null ? currentUser.sms_notifications : prev.sms_notifications,
        theme: (currentUser.theme === 'light' || currentUser.theme === 'dark' || currentUser.theme === 'system')
               ? currentUser.theme
               : (prev.theme === 'light' || prev.theme === 'dark' || prev.theme === 'system' ? prev.theme : 'system'),
      }));
    }
  }, [currentUser]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
          phone: formData.phone, // Add phone to update
          // updated_at will be handled by Supabase or a trigger
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    if (!currentUser) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          email_notifications: formData.email_notifications,
          push_notifications: formData.push_notifications,
          sms_notifications: formData.sms_notifications,
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveRegionalPreferences = async () => {
    if (!currentUser) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          language: formData.language,
          // Currency is still TZS only for now, not saved from form
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      toast({
        title: "Regional preferences updated",
        description: "Your language settings have been saved.",
      });
    } catch (error) {
      console.error('Error updating regional preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update regional preferences.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleThemeChange = (themeValue: 'light' | 'dark' | 'system') => {
    setFormData(prev => ({ ...prev, theme: themeValue }));
    // Add logic to immediately apply theme if desired, or wait for "Apply Theme" button
    // For now, just updates formData
  };

  const handleApplyTheme = async () => {
    if (!currentUser) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          theme: formData.theme,
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      // Add actual theme application logic here (e.g., update body class, use context)
      // This might involve a separate hook or utility function.
      // For now, we'll just toast.
      if (formData.theme) {
        document.documentElement.classList.remove('light', 'dark');
        if (formData.theme === 'light' || formData.theme === 'dark') {
          document.documentElement.classList.add(formData.theme);
        } else { // system
          // You might need a more sophisticated way to detect system preference
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.add('light');
          }
        }
      }
      
      toast({
        title: "Theme applied",
        description: `Switched to ${formData.theme} theme.`,
      });
    } catch (error) {
      console.error('Error applying theme:', error);
      toast({
        title: "Error",
        description: "Failed to apply theme.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account settings and preferences</p>
      </div>
      
      {/* Settings tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-8 w-24 mt-4" />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24 border-2 border-blue-100">
                      <AvatarImage src={formData.avatar_url ?? ''} alt={formData.full_name ?? ''} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                        {formData.full_name ? formData.full_name.charAt(0) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="mt-4">
                      Change Photo
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input 
                          id="full_name"
                          value={formData.full_name ?? ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email"
                          type="email"
                          value={formData.email ?? ''}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone"
                          value={formData.phone ?? ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" className="mt-2">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48 mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-32" />
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.email_notifications ?? false}
                          onChange={() => {
                            setFormData(prev => ({
                              ...prev,
                              email_notifications: !(prev.email_notifications ?? false)
                            }));
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications on your device</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.push_notifications ?? false}
                          onChange={() => {
                            setFormData(prev => ({
                              ...prev,
                              push_notifications: !(prev.push_notifications ?? false)
                            }));
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.sms_notifications ?? false}
                          onChange={() => {
                            setFormData(prev => ({
                              ...prev,
                              sms_notifications: !(prev.sms_notifications ?? false)
                            }));
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotificationPreferences} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Update Password</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Protect your account with 2FA</p>
                </div>
                <Button variant="outline">Set Up</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-xs text-gray-500">Dar es Salaam, Tanzania • Chrome on macOS</p>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 font-medium">Active Now</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Mobile App</p>
                      <p className="text-xs text-gray-500">Dar es Salaam, Tanzania • iPhone 13</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Last active 2 hours ago</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Sign Out All Other Sessions</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-32" />
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>Customize your regional preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select 
                      id="language"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.language ?? 'English'}
                      onChange={handleSelectChange}
                    >
                      <option value="English">English</option>
                      <option value="Swahili">Swahili</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <div className="flex h-10 w-full items-center rounded-md border bg-gray-100 px-3 py-2 text-sm text-muted-foreground">
                      Tanzanian Shilling (TZS)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currency is set to TZS for all users.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveRegionalPreferences} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="light"
                    name="theme"
                    value="light"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    checked={formData.theme === 'light'}
                    onChange={() => handleThemeChange('light')}
                  />
                  <Label htmlFor="light">Light Theme</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="dark"
                    name="theme"
                    value="dark"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    checked={formData.theme === 'dark'}
                    onChange={() => handleThemeChange('dark')}
                  />
                  <Label htmlFor="dark">Dark Theme</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="system"
                    name="theme"
                    value="system"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    checked={formData.theme === 'system'}
                    onChange={() => handleThemeChange('system')}
                  />
                  <Label htmlFor="system">System Theme</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleApplyTheme} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Theme'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
