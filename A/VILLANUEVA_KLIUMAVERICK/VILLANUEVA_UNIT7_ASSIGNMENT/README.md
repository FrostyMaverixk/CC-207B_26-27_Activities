# Org Fair

Flutter app for the CICT Org Fair. Event listings are configured to load from
Contentful's Content Delivery API.

## Configure Contentful

Create a Contentful content type with the ID `fairevent` and these fields:

| Field | Contentful type |
|---|---|
| `title` | Short text |
| `orgId` | Short text |
| `startsAt` | Date and time |
| `venue` | Short text |
| `description` | Long text |
| `cancelled` | Boolean |

Publish the event entries, then create an API key and use its **Content Delivery
API access token**. Do not use a Content Management token in the app.

Update the ignored `cms.json` file with your Contentful space ID and delivery
token:

```json
{
  "CMS": "contentful",
  "CMS_SPACE": "your-space-id",
  "CMS_TOKEN": "your-delivery-token"
}
```

The local `cms.json` is ignored by Git. Keep your delivery token there and do
not commit it. The Content Delivery API only returns published entries.

## Run and test

```powershell
flutter pub get
flutter run --dart-define-from-file=cms.json
flutter test
flutter analyze
```

Without `cms.json` defines, the app uses built-in sample events. Contentful
returns published entries; drafts are not available through the Content
Delivery API.
