# Product Mission

## Pitch

Resvi is a Chrome extension that helps fashion enthusiasts and bargain hunters secure limited Zalando Lounge flash sale items by providing automated campaign product reservation with precise timing and intelligent filtering.

## Users

### Primary Customers

- **Fashion Enthusiasts**: Style-conscious shoppers who actively follow designer brands and limited-time fashion campaigns
- **Bargain Hunters**: Deal-seeking consumers who compete for heavily discounted premium fashion items during flash sales

### User Personas

**Competitive Fashion Shopper** (25-45 years old)
- **Role:** Working professionals, fashion bloggers, resellers
- **Context:** Limited time to manually monitor flash sales, competing with other buyers for exclusive deals
- **Pain Points:** Missing flash sale start times, slow manual product selection, items selling out before checkout
- **Goals:** Secure desired fashion items at discount prices, maximize success rate in competitive flash sales

## The Problem

### Flash Sale Timing Competition

Fashion flash sales on platforms like Zalando Lounge start at exact times with limited inventory. Manual buyers must wake up early or monitor campaigns constantly, often losing out to faster competitors. Competition is so intense that desired items sell out within minutes.

**Our Solution:** Automated campaign entry at precise timing with instant product selection and cart addition.

### Manual Product Filtering Inefficiency

Users waste precious seconds during flash sales manually browsing, filtering, and selecting products while inventory depletes rapidly. Manual sorting and comparison across multiple criteria (brand, size, price, discount) is too slow for competitive flash sale environments.

**Our Solution:** Pre-configured filters with automated product selection and sorting based on user preferences.

### Campaign Access Limitations

Zalando Lounge campaigns are only accessible at their start time, preventing pre-loading or advance preparation. Users cannot preview or prepare their selections, making speed during the live campaign critical.

**Our Solution:** Instant campaign URL opening with background service coordination for maximum speed.

## Differentiators

### Precise Timing Execution

Unlike generic automation tools, we provide millisecond-accurate campaign entry using Chrome's native alarm API with performance.now() timing. This ensures users enter campaigns at the exact moment they become available, maximizing their competitive advantage.

### Campaign-Specific Product Intelligence

Unlike broad web automation tools, we understand Zalando Lounge's specific campaign structure, product filtering, and cart mechanics. Our extension navigates the exact DOM elements and API calls needed for successful product reservation.

### User-Controlled Automation Boundaries

Unlike fully automated purchasing bots, we respect user autonomy by automating only product reservation while leaving final checkout decisions to the user. This maintains ethical purchasing practices while providing competitive timing advantages.

## Key Features

### Core Features

- **Campaign Configuration UI:** Intuitive popup interface for entering campaign IDs, setting product filters, and scheduling execution times
- **URL-based Campaign Access:** Automatic campaign URL opening using extracted campaign IDs at precise scheduled times
- **Automated Product Selection:** Intelligent filtering, sorting, and cart addition based on user-defined criteria
- **Precise Timing Execution:** Millisecond-accurate campaign entry using Chrome alarms API for maximum competitive advantage

### Collaboration Features

- **Campaign ID Extraction:** Simplified workflow for extracting campaign identifiers from Zalando Lounge URLs
- **Multi-criteria Filtering:** Advanced product selection based on brand, size, color, price range, and discount percentage
- **Flexible Sorting Options:** Support for various product sorting methods including popularity, price, and discount levels
- **Batch Cart Addition:** Simultaneous addition of multiple matching products to maximize reservation success
- **Performance Monitoring:** Real-time feedback on execution timing and success rates
- **Campaign History:** Track of past campaign configurations and results for optimization