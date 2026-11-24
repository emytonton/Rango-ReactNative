#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>

@interface LocalNotificationModule : NSObject <RCTBridgeModule>
@end

@implementation LocalNotificationModule

RCT_EXPORT_MODULE(LocalNotification)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

static UNAuthorizationOptions const AuthorizationOptions =
    UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge;

static BOOL IsAllowed(UNAuthorizationStatus status)
{
  return status == UNAuthorizationStatusAuthorized || status == UNAuthorizationStatusProvisional;
}

RCT_EXPORT_METHOD(show : (double)identifier title : (NSString *)title body : (NSString *)body)
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  content.title = title;
  content.body = body;
  content.sound = [UNNotificationSound defaultSound];
  NSString *requestId = [NSString stringWithFormat:@"rango-%lld", (long long)identifier];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:requestId content:content trigger:nil];
  [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:nil];
}

RCT_EXPORT_METHOD(areEnabled : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter]
      getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
        resolve(@(IsAllowed(settings.authorizationStatus)));
      }];
}

RCT_EXPORT_METHOD(isUndetermined : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter]
      getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
        resolve(@(settings.authorizationStatus == UNAuthorizationStatusNotDetermined));
      }];
}

RCT_EXPORT_METHOD(requestAuthorization : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter]
      requestAuthorizationWithOptions:AuthorizationOptions
                    completionHandler:^(BOOL granted, NSError *error) {
                      resolve(@(granted));
                    }];
}

RCT_EXPORT_METHOD(openSettings)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSURL *url = [NSURL URLWithString:UIApplicationOpenSettingsURLString];
    if (url) {
      [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
    }
  });
}

@end
