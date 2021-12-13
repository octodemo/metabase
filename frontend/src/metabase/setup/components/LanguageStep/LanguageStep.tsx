import React from "react";
import { t } from "ttag";
import Button from "metabase/components/Button";
import ActiveStep from "../ActiveStep";
import InactiveStep from "../InvactiveStep";
import { Locale } from "../../types";
import { LanguageList, LanguageItem } from "./LanguageStep.styled";

interface Props {
  locales: Locale[];
  selectedLocale?: Locale;
  isActive?: boolean;
  isCompleted?: boolean;
  onNextClick?: () => void;
  onLocaleChange?: (locale: Locale) => void;
}

const LanguageStep = ({
  locales,
  selectedLocale,
  isActive,
  isCompleted,
  onNextClick,
  onLocaleChange,
}: Props) => {
  if (!isActive) {
    return (
      <InactiveStep
        title={t`Your language is set to ${selectedLocale?.name}`}
        label={1}
        isCompleted={isCompleted}
      />
    );
  }

  return (
    <ActiveStep
      title={t`What's your preferred language?`}
      label={1}
      description={t`This language will be used throughout Metabase and will be the default for new users.`}
    >
      <LanguageList>
        {locales.map(locale => (
          <LanguageItem
            key={locale.code}
            isSelected={locale.code === selectedLocale?.code}
            onClick={() => onLocaleChange?.(locale)}
          >
            {locale.name}
          </LanguageItem>
        ))}
      </LanguageList>
      <Button primary onClick={onNextClick}>{t`Next`}</Button>
    </ActiveStep>
  );
};

export default LanguageStep;
