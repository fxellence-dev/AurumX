/**
 * TradingView Symbol Info Widget
 * Displays real-time gold price data without chart
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface TradingViewMiniWidgetProps {
  symbol: string;
  height?: number;
}

export function TradingViewMiniWidget({ symbol, height = 120 }: TradingViewMiniWidgetProps) {
  // Generate HTML with embedded TradingView Mini Symbol Overview widget
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            background-color: transparent;
            overflow: hidden;
          }
          body {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .tradingview-widget-container {
            width: 100%;
            height: 100%;
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
        <!-- TradingView Widget BEGIN -->
        <div class="tradingview-widget-container">
          <div class="tradingview-widget-container__widget"></div>
          <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" async>
          {
            "symbol": "${symbol}",
            "width": "100%",
            "height": "100%",
            "locale": "en",
            "dateRange": "1M",
            "colorTheme": "dark",
            "isTransparent": true,
            "autosize": false,
            "largeChartUrl": "",
            "chartOnly": false,
            "noTimeScale": false
          }
          </script>
        </div>
        <!-- TradingView Widget END -->
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
  },
  webview: {
    backgroundColor: 'transparent',
  },
});
