# dashboard-for-labour

Social media tools for activists for #ge17

# What's New
## version: 1.3.6
- Disabled facebook from being used with Twibbyn
- Tiny UI tweak

## 1.3.5
- REFACTOR: Api-queue to use sorted sets instead of lists
- ADDED: Timing class to helpers

## 1.3.4
- Updated facebook share to use Share Dialog UI
- Minor bug fixes

## 1.3.3
- Added improved share flow to twibbon.
- Added share flwo to storm.
- Improve manifest.json (better PWA experience)

## 1.3.2
- Added metadata, updated icons, copy.
- Removed Images card.

## 1.3.1
- Added realtime use count to twibbyn card
- Change Thunderclap to Storm

## 1.3.0
- Added support for thunderclap campaigns.

## 1.2.2
- Request 'publish_actions' permissions for facebook (needed) for thunderclap
- Enhanced composer to support preservation of image aspect ratios
- Added basic UI for repositioning non-square avatars
- Extended the twibbyn API
- Minor bug fixes

## 1.2.1
- Fixed issues with Facebook App Id  

## 1.2.0
- Small UI Tweaks
- API Queue is now shared using redis

## 1.1.1
- Added thunderclap list view
- Fixed polymer build process
- Added Labour branding
- Session handling moved to redis for improved scalability

## 1.1.0
- Added ability for users to upload images (for moderation)
 
## 1.0.2
- Fixed Issue #5: Avatar doesn't display if changed in twitter after first dashboard login.

## 1.0.1
- Fixed Issue #3: Constituency search input is illegible
- Fixed Issue #4: Selecting a campaign should be more obvious
- Fixed problem with tweeting memes.
- Fixed problem persisting user's constituency.
- Added basic validation on constituency lookup.

## 1.0.0
- Added constituency lookups. Now displays key consituency information
- Added meme campaigns. Users can post images directly to facebook and twitter

## 0.9.1
- Optimised initial api loading
- Changed permissions to enable authenticated users to write their own metadata
