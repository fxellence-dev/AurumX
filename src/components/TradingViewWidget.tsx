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
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js" async>
    {
      "lineWidth": 2,
      "lineType": 0,
      "chartType": "area",
      "fontColor": "rgb(106, 109, 120)",
      "gridLineColor": "rgba(46, 46, 46, 0.06)",
      "volumeUpColor": "rgba(34, 171, 148, 0.5)",
      "volumeDownColor": "rgba(247, 82, 95, 0.5)",
      "backgroundColor": "#0A0A0A",
      "widgetFontColor": "#FFFFFF",
      "upColor": "#22ab94",
      "downColor": "#f7525f",
      "borderUpColor": "#22ab94",
      "borderDownColor": "#f7525f",
      "wickUpColor": "#22ab94",
      "wickDownColor": "#f7525f",
      "colorTheme": "dark",
      "isTransparent": false,
      "locale": "en",
      "chartOnly": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "symbols": [
        [
          "${symbol}|12M"
        ]
      ],
      "dateRanges": [
        "12m|1D",
        "1d|1",
        "1m|30",
        "3m|60",
        "60m|1W",
        "all|1M"
      ],
      "fontSize": "10",
      "headerFontSize": "small",
      "autosize": true,
      "width": "100%",
      "height": "100%",
      "noTimeScale": false,
      "hideDateRanges": false,
      "hideMarketStatus": false,
      "hideSymbolLogo": false
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
