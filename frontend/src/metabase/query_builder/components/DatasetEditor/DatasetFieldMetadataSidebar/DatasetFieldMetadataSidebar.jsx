import React, { useCallback, useMemo } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { t } from "ttag";
import _ from "underscore";

import Databases from "metabase/entities/databases";
import Field from "metabase-lib/lib/metadata/Field";
import {
  field_visibility_types,
  field_semantic_types,
  has_field_values_options,
} from "metabase/lib/core";
import { keyForColumn } from "metabase/lib/dataset";

import RootForm from "metabase/containers/Form";

import SidebarContent from "metabase/query_builder/components/SidebarContent";
import ColumnSettings from "metabase/visualizations/components/ColumnSettings";
import { getGlobalSettingsForColumn } from "metabase/visualizations/lib/settings/column";

import { updateCardVisualizationSettings } from "metabase/query_builder/actions";

import FormFieldDivider from "./FormFieldDivider";
import MappedFieldPicker from "./MappedFieldPicker";
import SemanticTypePicker from "./SemanticTypePicker";
import { PaddedContent } from "./DatasetFieldMetadataSidebar.styled";

const propTypes = {
  dataset: PropTypes.object.isRequired,
  field: PropTypes.instanceOf(Field).isRequired,
  IDFields: PropTypes.array.isRequired,
  updateCardVisualizationSettings: PropTypes.func.isRequired,
};

function mapStateToProps(state, { dataset }) {
  const databaseId = dataset.databaseId();
  return {
    IDFields: Databases.selectors.getIdfields(state, { databaseId }),
  };
}

const mapDispatchToProps = { updateCardVisualizationSettings };

function getVisibilityTypeName(visibilityType) {
  if (visibilityType.id === "normal") {
    return t`Table and details views`;
  }
  if (visibilityType.id === "details-only") {
    return t`Detail views only`;
  }
  return visibilityType.name;
}

function getFieldSemanticTypeSections() {
  const types = [
    ...field_semantic_types,
    {
      id: null,
      name: t`No special type`,
      section: t`Other`,
    },
  ];

  const groupedBySection = _.groupBy(types, "section");

  return Object.entries(groupedBySection).map(entry => {
    const [name, items] = entry;
    return {
      name,
      items: items.map(item => ({
        value: item.id,
        name: item.name,
        description: item.description,
      })),
    };
  });
}

function getFormFields({ dataset, IDFields }) {
  const visibilityTypeOptions = field_visibility_types
    .filter(type => type.id !== "sensitive")
    .map(type => ({
      name: getVisibilityTypeName(type),
      value: type.id,
    }));

  function MappedFieldWidget(formFieldProps) {
    return <MappedFieldPicker {...formFieldProps} dataset={dataset} />;
  }

  function SemanticTypeWidget(formFieldProps) {
    return (
      <SemanticTypePicker
        {...formFieldProps}
        sections={getFieldSemanticTypeSections()}
        IDFields={IDFields}
      />
    );
  }

  return [
    { name: "display_name", title: t`Display name` },
    {
      name: "description",
      title: t`Description`,
      placeholder: t`It’s optional, but oh, so helpful`,
      type: "text",
    },
    dataset.isNative() && {
      name: "id",
      title: t`Database column this maps to`,
      widget: MappedFieldWidget,
    },
    {
      name: "semantic_type",
      widget: SemanticTypeWidget,
    },
    {
      name: "visibility_type",
      title: t`This column should appear in…`,
      type: "radio",
      options: visibilityTypeOptions,
    },
    {
      name: "display_as",
      title: t`Display as`,
      type: "radio",
      options: [
        { name: t`Text`, value: "text" },
        { name: t`Link`, value: "link" },
      ],
    },
    {
      name: "has_field_values",
      title: t`Filtering on this field`,
      info: t`When this field is used in a filter, what should people use to enter the value they want to filter on?`,
      type: "select",
      options: has_field_values_options,
    },
  ].filter(Boolean);
}

const HIDDEN_COLUMN_FORMATTING_OPTIONS = new Set(["column_title"]);

function DatasetFieldMetadataSidebar({
  dataset,
  field,
  IDFields,
  updateCardVisualizationSettings,
}) {
  const initialValues = useMemo(() => {
    const values = {
      display_name: field?.display_name,
      description: field?.description,
      semantic_type: field?.semantic_type,
      visibility_type: "normal",
      display_as: "text",
      has_field_values: "search",
    };
    if (dataset.isNative()) {
      values.id = field?.id;
    }
    return values;
  }, [field, dataset]);

  const formFields = useMemo(() => getFormFields({ dataset, IDFields }), [
    dataset,
    IDFields,
  ]);

  const fieldFormattingSettings = useMemo(() => {
    if (!field) {
      return {};
    }
    const fieldKey = keyForColumn(field);
    const columnSettings = dataset.setting("column_settings", {});
    return columnSettings[fieldKey] || {};
  }, [dataset, field]);

  const handleFormattingSettingsChange = useCallback(
    settings => {
      const fieldKey = keyForColumn(field);
      const nextFieldSettings = {
        ...fieldFormattingSettings,
        ...settings,
      };
      updateCardVisualizationSettings({
        column_settings: {
          ...dataset.setting("column_settings"),
          [fieldKey]: nextFieldSettings,
        },
      });
    },
    [dataset, field, fieldFormattingSettings, updateCardVisualizationSettings],
  );

  return (
    <SidebarContent>
      <PaddedContent>
        {field && (
          <RootForm
            fields={formFields}
            initialValues={initialValues}
            overwriteOnInitialValuesChange
          >
            {({ Form, FormField }) => (
              <Form>
                <FormField name="display_name" />
                <FormField name="description" />
                {dataset.isNative() && <FormField name="id" />}
                <FormField name="semantic_type" />
                <FormFieldDivider />
                <ColumnSettings
                  column={field}
                  value={fieldFormattingSettings}
                  onChange={handleFormattingSettingsChange}
                  inheritedSettings={getGlobalSettingsForColumn(field)}
                  denylist={HIDDEN_COLUMN_FORMATTING_OPTIONS}
                />
                <FormField name="visibility_type" />
                <FormField name="display_as" />
                <FormField name="has_field_values" />
              </Form>
            )}
          </RootForm>
        )}
      </PaddedContent>
    </SidebarContent>
  );
}

DatasetFieldMetadataSidebar.propTypes = propTypes;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DatasetFieldMetadataSidebar);