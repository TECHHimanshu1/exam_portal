
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ColorPickerInput } from '@/components/ui/color-picker-input';
import { Settings, Mail, Bell, Shield, Database, Upload } from 'lucide-react';

const SettingsPage = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'School Exam Portal',
    adminEmail: 'admin@example.com',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
  });
  
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: 'smtp.example.com',
    smtpPort: '587',
    smtpUsername: 'notifications@example.com',
    smtpPassword: '********',
    enableEmailNotifications: true,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    newUserEmail: true,
    examScheduledEmail: true,
    examResultsEmail: true,
    systemAlertsEmail: true,
    enableBrowserNotifications: true,
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    passwordComplexity: 'medium',
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    requireEmailVerification: true,
  });
  
  const handleGeneralSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('General settings saved successfully');
  };
  
  const handleEmailSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Email settings saved successfully');
  };
  
  const handleNotificationSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification settings saved successfully');
  };
  
  const handleSecuritySettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Security settings saved successfully');
  };
  
  const handleBackupDatabase = () => {
    toast.success('Database backup initiated. You will be notified when complete.');
  };
  
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings for the examination portal
          </p>
        </div>
        
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <form onSubmit={handleGeneralSettingsSave}>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure general settings for the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input 
                      id="siteName" 
                      value={generalSettings.siteName}
                      onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input 
                      id="adminEmail" 
                      type="email"
                      value={generalSettings.adminEmail}
                      onChange={(e) => setGeneralSettings({...generalSettings, adminEmail: e.target.value})}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2 items-center">
                        <Input 
                          id="primaryColor" 
                          value={generalSettings.primaryColor}
                          onChange={(e) => setGeneralSettings({...generalSettings, primaryColor: e.target.value})}
                        />
                        <div 
                          className="h-10 w-10 rounded border" 
                          style={{ backgroundColor: generalSettings.primaryColor }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex gap-2 items-center">
                        <Input 
                          id="secondaryColor" 
                          value={generalSettings.secondaryColor}
                          onChange={(e) => setGeneralSettings({...generalSettings, secondaryColor: e.target.value})}
                        />
                        <div 
                          className="h-10 w-10 rounded border" 
                          style={{ backgroundColor: generalSettings.secondaryColor }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="logoUpload">School Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded bg-muted flex items-center justify-center border">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <Button type="button" variant="outline">
                        Upload New Logo
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended size: 200x200 pixels. Max file size: 2MB. Formats: PNG, JPG
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline">Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="email">
            <Card>
              <form onSubmit={handleEmailSettingsSave}>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>
                    Configure email server settings for sending notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable email notifications
                      </p>
                    </div>
                    <Switch
                      checked={emailSettings.enableEmailNotifications}
                      onCheckedChange={(checked) => 
                        setEmailSettings({...emailSettings, enableEmailNotifications: checked})
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtpServer">SMTP Server</Label>
                    <Input 
                      id="smtpServer" 
                      value={emailSettings.smtpServer}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpServer: e.target.value})}
                      disabled={!emailSettings.enableEmailNotifications}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input 
                      id="smtpPort" 
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                      disabled={!emailSettings.enableEmailNotifications}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input 
                      id="smtpUsername" 
                      value={emailSettings.smtpUsername}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                      disabled={!emailSettings.enableEmailNotifications}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input 
                      id="smtpPassword" 
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                      disabled={!emailSettings.enableEmailNotifications}
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    disabled={!emailSettings.enableEmailNotifications}
                    onClick={() => toast.success('Test email sent successfully')}
                  >
                    Send Test Email
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline">Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <form onSubmit={handleNotificationSettingsSave}>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure what events trigger notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable push notifications in browser
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.enableBrowserNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, enableBrowserNotifications: checked})
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Email Notification Events</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>New User Registration</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when a new user registers
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.newUserEmail}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, newUserEmail: checked})
                        }
                        disabled={!emailSettings.enableEmailNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Exam Scheduled</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when an exam is scheduled
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.examScheduledEmail}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, examScheduledEmail: checked})
                        }
                        disabled={!emailSettings.enableEmailNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Exam Results Available</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when exam results are published
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.examResultsEmail}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, examResultsEmail: checked})
                        }
                        disabled={!emailSettings.enableEmailNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify for important system alerts
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.systemAlertsEmail}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, systemAlertsEmail: checked})
                        }
                        disabled={!emailSettings.enableEmailNotifications}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline">Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <form onSubmit={handleSecuritySettingsSave}>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security options for the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for admin accounts
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => 
                        setSecuritySettings({...securitySettings, twoFactorEnabled: checked})
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Require email verification for new accounts
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireEmailVerification}
                      onCheckedChange={(checked) => 
                        setSecuritySettings({...securitySettings, requireEmailVerification: checked})
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="passwordComplexity">Password Complexity</Label>
                    <select
                      id="passwordComplexity"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={securitySettings.passwordComplexity}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordComplexity: e.target.value})}
                    >
                      <option value="low">Low - At least 6 characters</option>
                      <option value="medium">Medium - Alphanumeric, 8+ characters</option>
                      <option value="high">High - Alphanumeric with special characters, 10+ characters</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input 
                      id="sessionTimeout" 
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input 
                      id="maxLoginAttempts" 
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: e.target.value})}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline">Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>
                  System backup, restore, and maintenance options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Database Management</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Backup Database</h4>
                      <p className="text-sm text-muted-foreground">
                        Create a backup of the entire database
                      </p>
                    </div>
                    <Button onClick={handleBackupDatabase}>
                      Backup Now
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Restore Database</h4>
                      <p className="text-sm text-muted-foreground">
                        Restore from a previously created backup
                      </p>
                    </div>
                    <Button variant="outline">
                      Select Backup
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">System Information</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span>1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Backup</span>
                      <span>Never</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database Size</span>
                      <span>25.4 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Users</span>
                      <span>873</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Exams</span>
                      <span>152</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button variant="destructive" className="w-full">
                    Clear All Cache
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    This will clear all cached data and might temporarily slow down the application
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
