import { AnalyticsService } from './src/lib/analytics.js';

async function testFixedAnalytics() {
  console.log('🧪 Testing fixed analytics service...\n');

  try {
    const userId = 'test-user-123';
    const workspaceId = 'workspace-1';

    console.log('1. Testing personal analytics for user:', userId);
    const personalAnalytics = await AnalyticsService.getRealAnalytics(userId);
    
    console.log('✅ Personal Analytics:');
    console.log('- Documents per day count:', personalAnalytics.documentsPerDay.length);
    console.log('- Categories found:', personalAnalytics.documentsByCategory.length);
    console.log('- Processing time data points:', personalAnalytics.processingTime.length);
    console.log('- User activity entries:', personalAnalytics.userActivity.length);
    console.log('- Tag usage entries:', personalAnalytics.tagUsage.length);
    console.log('- Weekly stats:', personalAnalytics.weeklyStats);

    console.log('\n2. Testing workspace analytics for workspace:', workspaceId);
    const workspaceAnalytics = await AnalyticsService.getRealAnalytics(userId, workspaceId);
    
    console.log('✅ Workspace Analytics:');
    console.log('- Documents per day count:', workspaceAnalytics.documentsPerDay.length);
    console.log('- Categories found:', workspaceAnalytics.documentsByCategory.length);
    console.log('- Processing time data points:', workspaceAnalytics.processingTime.length);
    console.log('- User activity entries:', workspaceAnalytics.userActivity.length);
    console.log('- Tag usage entries:', workspaceAnalytics.tagUsage.length);
    console.log('- Weekly stats:', workspaceAnalytics.weeklyStats);

    console.log('\n📊 Sample Data:');
    console.log('Categories:', personalAnalytics.documentsByCategory);
    console.log('Top tags:', personalAnalytics.tagUsage.slice(0, 5));
    console.log('User activity:', personalAnalytics.userActivity);

  } catch (error) {
    console.error('❌ Error testing analytics:', error);
  }
}

testFixedAnalytics().then(() => {
  console.log('\n🎯 Analytics test completed');
  process.exit(0);
});
