#import <Network/Network.h>
#import <React/RCTEventEmitter.h>

static NSString *const ConnectivityChanged = @"connectivityChanged";

@interface ConnectivityModule : RCTEventEmitter
@end

@implementation ConnectivityModule {
  nw_path_monitor_t _monitor;
  BOOL _online;
  BOOL _observing;
}

RCT_EXPORT_MODULE(Connectivity)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    _online = YES;
    _monitor = nw_path_monitor_create();
    __weak ConnectivityModule *weakSelf = self;
    nw_path_monitor_set_update_handler(_monitor, ^(nw_path_t path) {
      [weakSelf publish:nw_path_get_status(path) == nw_path_status_satisfied];
    });
    nw_path_monitor_set_queue(_monitor, dispatch_get_main_queue());
    nw_path_monitor_start(_monitor);
  }
  return self;
}

- (void)invalidate
{
  nw_path_monitor_cancel(_monitor);
  [super invalidate];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ ConnectivityChanged ];
}

- (void)startObserving
{
  _observing = YES;
}

- (void)stopObserving
{
  _observing = NO;
}

- (void)publish:(BOOL)value
{
  if (value == _online) {
    return;
  }
  _online = value;
  if (_observing) {
    [self sendEventWithName:ConnectivityChanged body:@(value)];
  }
}

RCT_EXPORT_METHOD(isOnline : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@(self->_online));
  });
}

@end
