/**
 * TradingView Widget Component
 * Embeds TradingView Mini Symbol Overview widget using WebView
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '@/theme';

interface TradingViewWidgetProps {
  symbol: string;
  currencyCode: string;
  height?: number;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  currencyCode,
  height = 400,
}) => {
  const [loading, setLoading] = React.useState(true);

  const generateHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: #0A0A0A;
      overflow: hidden;
      width: 100%;
      height: 100vh;
    }
    .tradingview-widget-container {
      width: 100%;
      height: 100%;
      position: relative;
    }
    .tradingview-widget-container__widget {
      width: 100%;
      height: 100%;
    }
    .tradingview-widget-copyright {
      display: none !important;
    }
  </style>
</head>
<body>
  <div class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" async>
    {
      "symbol": "${symbol}",
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "dateRange": "12M",
      "colorTheme": "dark",
      "isTransparent": false,
      "autosize": true,
      "largeChartUrl": "",
      "noTimeScale": false,
      "chartOnly": false
    }
    </script>
  </div>
</body>
</html>
    `;
  };

  return (
    <View style={[styles.container, { height }]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold[500]} />
        </View>
      )}
      <WebView
        source={{ html: generateHTML() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={() => setLoading(false)}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    zIndex: 1,
  },
});
