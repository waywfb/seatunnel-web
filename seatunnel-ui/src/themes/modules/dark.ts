/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { GlobalThemeOverrides } from '../type'

const dark: GlobalThemeOverrides = {
  common: {
    bodyColor: '#030712',

    /**************** Brand color */
    primaryColor: '#3B82F6',
    primaryColorHover: '#2563EB',
    primaryColorPressed: '#1D4ED8',
    primaryColorSuppl: '#3B82F6',

    /**************** Function of color */
    infoColor: '#3B82F6',
    successColor: '#22C55E',
    warningColor: '#F59E0B',
    errorColor: '#EF4444',

    /**************** Text */
    textColor1: '#F9FAFB',
    textColor2: '#D1D5DB',
    textColor3: '#9CA3AF',

    /**************** Border */
    borderColor: '#374151',
    dividerColor: '#374151',

    /**************** Placeholder */
    placeholderColor: '#6B7280',
    placeholderColorDisabled: '#4B5563',

    /**************** Focus */
    focusColor: 'rgba(59, 130, 246, 0.25)',
    boxShadowFocus: '0 0 0 2px rgba(59, 130, 246, 0.25)',
    boxShadowFocusOutset: '0 0 0 2px rgba(59, 130, 246, 0.25)',
    boxShadowFocusOutsetInset: 'inset 0 0 0 2px rgba(59, 130, 246, 0.25)',
    boxShadowFromPopup: '0 2px 8px rgba(0, 0, 0, 0.4)',

    /**************** Opacity */
    opacityDisabled: '0.5',
    fontWeight: '400',
    fontWeightStrong: '500',

    /**************** Radius */
    borderRadius: '4px',
    borderRadiusSmall: '4px'
  },

  Layout: {
    color: '#030712',
    headerColor: '#111827',
    headerColorModal: '#111827',
    headerColorPopover: '#111827',
    siderColor: '#111827',
    siderColorModal: '#111827',
    siderColorPopover: '#111827',
    borderColor: '#374151'
  },

  Menu: {
    itemColorActive: '#1E3A5F',
    itemColorActiveHover: '#1E40AF',
    itemTextColor: '#D1D5DB',
    itemTextColorActive: '#60A5FA',
    itemTextColorChildActive: '#60A5FA',
    itemTextColorHover: '#F9FAFB',
    itemTextColorChildActiveHover: '#3B82F6',
    itemIconColor: '#9CA3AF',
    itemIconColorActive: '#60A5FA',
    itemIconColorHover: '#D1D5DB',
    itemColorHover: '#1F2937',
    itemHeight: '40px',
    borderRadius: '4px',
    borderColor: '#374151',
    color: '#111827',
    groupTextColor: '#6B7280',
    arrowColor: '#9CA3AF'
  },

  Table: {
    thColor: '#1F2937',
    thColorModal: '#1F2937',
    thColorPopover: '#1F2937',
    thTextColor: '#9CA3AF',
    thFontWeight: '500',
    tdColor: '#111827',
    tdColorModal: '#111827',
    tdColorPopover: '#111827',
    tdTextColor: '#F9FAFB',
    borderColor: '#374151',
    borderColorModal: '#374151',
    borderColorPopover: '#374151',
    tdColorStriped: '#1A1A1A',
    tdColorHover: '#1F2937'
  },

  Button: {
    color: '#3B82F6',
    colorHover: '#2563EB',
    colorPressed: '#1D4ED8',
    colorFocus: '#3B82F6',
    textColor: '#FFFFFF',
    textColorHover: '#FFFFFF',
    textColorPressed: '#FFFFFF',
    textColorFocus: '#FFFFFF',
    border: '1px solid transparent',
    borderHover: '1px solid transparent',
    borderPressed: '1px solid transparent',
    borderFocus: '1px solid transparent',
    textColorDisabled: '#6B7280',
    opacityDisabled: '0.5',
    fontWeight: '500',
    borderRadius: '4px',
    height: '40px',
    padding: '0 16px',
    fontSize: '14px',
    iconSize: '18px',

    /* Secondary */
    colorSecondary: '#1F2937',
    colorSecondaryHover: '#374151',
    colorSecondaryPressed: '#4B5563',
    textColorSecondary: '#D1D5DB',
    textColorSecondaryHover: '#F9FAFB',
    textColorSecondaryPressed: '#F9FAFB',
    borderSecondary: '1px solid #4B5563',
    borderSecondaryHover: '1px solid #6B7280',

    /* Error / Destructive */
    colorError: '#EF4444',
    colorErrorHover: '#DC2626',
    colorErrorPressed: '#B91C1C',
    colorErrorFocus: '#EF4444',
    textColorError: '#FFFFFF',

    /* Warning */
    colorWarning: '#F59E0B',
    colorWarningHover: '#D97706',
    colorWarningPressed: '#B45309',
    colorWarningFocus: '#F59E0B',
    textColorWarning: '#FFFFFF',

    /* Success */
    colorSuccess: '#22C55E',
    colorSuccessHover: '#16A34A',
    colorSuccessPressed: '#15803D',
    colorSuccessFocus: '#22C55E',
    textColorSuccess: '#FFFFFF',

    /* Info */
    colorInfo: '#3B82F6',
    colorInfoHover: '#2563EB',
    colorInfoPressed: '#1D4ED8',
    colorInfoFocus: '#3B82F6',
    textColorInfo: '#FFFFFF',

    /* Ghost */
    textColorGhost: '#D1D5DB',
    textColorGhostHover: '#F9FAFB',
    colorGhost: 'transparent',
    colorGhostHover: '#1F2937',
    colorGhostPressed: '#374151',

    /* Text (link-like) */
    textColorText: '#60A5FA',
    textColorTextHover: '#3B82F6',
    textColorTextPressed: '#2563EB'
  },

  Input: {
    color: '#111827',
    colorModal: '#111827',
    colorPopover: '#111827',
    textColor: '#F9FAFB',
    placeholderColor: '#6B7280',
    border: '1px solid #4B5563',
    borderHover: '1px solid #6B7280',
    borderFocus: '1px solid #3B82F6',
    boxShadowFocus: '0 0 0 2px rgba(59, 130, 246, 0.25)',
    borderError: '1px solid #EF4444',
    boxShadowFocusError: '0 0 0 2px rgba(239, 68, 68, 0.2)',
    colorDisabled: '#1F2937',
    colorDisabledModal: '#1F2937',
    textColorDisabled: '#4B5563',
    borderRadius: '4px',
    height: '40px',
    fontSize: '14px',
    padding: '0 12px',
    iconSize: '18px'
  },

  Select: {
    menuColor: '#1F2937',
    menuColorModal: '#1F2937',
    menuColorPopover: '#1F2937',
    menuBoxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    menuBorder: '1px solid #374151',
    menuBorderRadius: '4px',
    optionTextColor: '#D1D5DB',
    optionTextColorHover: '#F9FAFB',
    optionTextColorActive: '#60A5FA',
    optionColorHover: '#374151',
    optionColorActive: '#1E3A5F',
    optionFontSize: '14px',
    optionHeight: '36px',
    optionPadding: '0 12px',
    color: '#111827',
    colorModal: '#111827',
    colorPopover: '#111827',
    border: '1px solid #4B5563',
    borderHover: '1px solid #6B7280',
    borderFocus: '1px solid #3B82F6',
    boxShadowFocus: '0 0 0 2px rgba(59, 130, 246, 0.25)',
    borderRadius: '4px',
    height: '40px',
    fontSize: '14px',
    placeholderColor: '#6B7280'
  },

  Card: {
    color: '#111827',
    colorModal: '#111827',
    colorPopover: '#111827',
    borderColor: '#374151',
    borderRadius: '8px',
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingLeft: '16px',
    paddingRight: '16px',
    boxShadow: 'none',
    titleFontSize: '16px',
    titleFontWeight: '500',
    titleTextColor: '#F9FAFB'
  },

  Dialog: {
    color: '#1E1E1E',
    colorModal: '#1E1E1E',
    colorPopover: '#1E1E1E',
    border: '1px solid #374151',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    titleFontSize: '16px',
    titleFontWeight: '600',
    titleTextColor: '#F9FAFB',
    contentFontSize: '14px',
    contentTextColor: '#D1D5DB',
    actionSpace: '16px'
  },

  Tooltip: {
    color: '#F9FAFB',
    textColor: '#111827',
    borderRadius: '4px',
    fontSize: '12px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.4)'
  },

  Popover: {
    color: '#1A1A1A',
    border: '1px solid #374151',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    padding: '12px',
    fontSize: '14px',
    textColor: '#D1D5DB'
  },

  Checkbox: {
    color: '#1F2937',
    colorChecked: '#3B82F6',
    border: '1px solid #4B5563',
    borderFocus: '1px solid #3B82F6',
    borderRadius: '4px',
    textColor: '#F9FAFB',
    size: '18px'
  },

  Radio: {
    radioColor: '#1F2937',
    radioColorActive: '#3B82F6',
    border: '1px solid #4B5563',
    borderActive: '1px solid #3B82F6',
    textColor: '#F9FAFB'
  },

  Switch: {
    railColor: '#4B5563',
    railColorActive: '#3B82F6',
    buttonColor: '#F9FAFB',
    buttonBoxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)'
  },

  Pagination: {
    itemColor: '#1F2937',
    itemColorHover: '#374151',
    itemColorActive: '#1E3A5F',
    itemTextColor: '#D1D5DB',
    itemTextColorHover: '#F9FAFB',
    itemTextColorActive: '#60A5FA',
    itemBorder: '1px solid #374151',
    itemBorderActive: '1px solid #3B82F6',
    itemBorderRadius: '4px',
    itemFontSize: '14px',
    itemSize: '36px',
    buttonBorder: '1px solid #374151',
    buttonIconColor: '#9CA3AF'
  },

  DatePicker: {
    itemColorActive: '#1E3A5F',
    itemColorHover: '#374151',
    itemTextColorActive: '#60A5FA',
    panelColor: '#1F2937',
    panelBorderColor: '#374151',
    panelBorderRadius: '8px',
    calendarDaysColor: '#9CA3AF'
  },

  Dropdown: {
    color: '#1A1A1A',
    colorModal: '#1A1A1A',
    colorPopover: '#1A1A1A',
    optionTextColor: '#D1D5DB',
    optionTextColorHover: '#F9FAFB',
    optionTextColorActive: '#60A5FA',
    optionColorHover: '#374151',
    optionColorActive: '#1E3A5F',
    borderRadius: '4px',
    border: '1px solid #374151',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    dividerColor: '#374151'
  },

  Tag: {
    color: '#1F2937',
    textColor: '#D1D5DB',
    border: '1px solid #374151',
    borderRadius: '4px',
    fontSize: '12px',
    padding: '0 8px',
    height: '24px'
  },

  Progress: {
    railColor: '#374151',
    color: '#3B82F6',
    textColor: '#D1D5DB',
    fontSize: '12px',
    fontWeight: '500'
  },

  Badge: {
    color: '#EF4444'
  },

  Alert: {
    color: '#1F2937',
    colorInfo: '#1E3A5F',
    colorSuccess: '#0A2E1A',
    colorWarning: '#2A1A00',
    colorError: '#2A0A0A',
    border: '1px solid #374151',
    borderInfo: '1px solid #1E40AF',
    borderSuccess: '1px solid #166534',
    borderWarning: '1px solid #78350F',
    borderError: '1px solid #991B1B',
    borderRadius: '8px',
    titleTextColor: '#F9FAFB',
    iconColor: '#60A5FA',
    contentTextColor: '#D1D5DB',
    closeIconColor: '#6B7280',
    padding: '12px 16px'
  },

  Message: {
    color: '#1F2937',
    colorInfo: '#1E3A5F',
    colorSuccess: '#0A2E1A',
    colorWarning: '#2A1A00',
    colorError: '#2A0A0A',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    iconColor: '#60A5FA',
    textColor: '#D1D5DB',
    closeColor: '#6B7280'
  },

  Notification: {
    color: '#1F2937',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    titleTextColor: '#F9FAFB',
    textColor: '#D1D5DB',
    closeColor: '#6B7280'
  },

  Empty: {
    textColor: '#6B7280',
    iconColor: '#4B5563',
    extraTextColor: '#9CA3AF'
  },

  LoadingBar: {
    color: '#3B82F6',
    colorError: '#EF4444'
  },

  Tabs: {
    tabTextColor: '#9CA3AF',
    tabTextColorActive: '#60A5FA',
    tabTextColorHover: '#F9FAFB',
    tabFontSize: '14px',
    tabFontWeight: '500',
    tabBorderRadius: '0',
    barColor: '#60A5FA',
    colorSegment: '#1F2937',
    tabColorSegment: '#111827',
    tabColorSegmentActive: '#111827',
    paneColor: '#111827',
    tabColor: 'transparent',
    tabColorHover: '#1F2937',
    borderColor: '#374151'
  },

  Collapse: {
    titleTextColor: '#F9FAFB',
    titleTextColorActive: '#60A5FA',
    titleFontSize: '14px',
    titleFontWeight: '500',
    arrowColor: '#9CA3AF',
    dividerColor: '#374151',
    itemBorderColor: '#374151',
    titlePadding: '12px 0'
  },

  TimePicker: {
    panelColor: '#1F2937',
    panelBorderColor: '#374151',
    panelBorderRadius: '8px',
    itemTextColor: '#D1D5DB',
    itemTextColorActive: '#60A5FA',
    itemColorHover: '#374151',
    itemColorActive: '#1E3A5F'
  },

  Slider: {
    railColor: '#4B5563',
    railColorHover: '#6B7280',
    fillColor: '#3B82F6',
    fillColorHover: '#2563EB',
    handleColor: '#F9FAFB',
    handleBoxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    handleBoxShadowHover: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    markColor: '#9CA3AF',
    markFontSize: '12px'
  },

  Drawer: {
    color: '#1F2937',
    border: '1px solid #374151',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    bodyPadding: '16px 24px',
    headerPadding: '16px 24px',
    footerPadding: '12px 24px'
  },

  Form: {
    labelTextColor: '#D1D5DB',
    labelFontSize: '14px',
    labelFontWeight: '500',
    feedbackTextColor: '#EF4444',
    feedbackFontSize: '12px',
    feedbackPadding: '4px 0 0'
  },

  DataTable: {
    thColor: '#1F2937',
    thTextColor: '#9CA3AF',
    thFontWeight: '500',
    tdColor: '#111827',
    tdTextColor: '#F9FAFB',
    borderColor: '#374151',
    tdColorHover: '#1F2937',
    tdColorStriped: '#1A1A1A',
    borderRadius: '4px',
    loadingColor: '#3B82F6',
    paginationColor: '#60A5FA',
    paginationTextColor: '#D1D5DB'
  }
}

export default dark
