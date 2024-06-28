import type {StackScreenProps} from '@react-navigation/stack';
import React, {useCallback, useMemo, useState} from 'react';
import {useOnyx} from 'react-native-onyx';
import type {ValueOf} from 'type-fest';
import ConfirmationPage from '@components/ConfirmationPage';
import ConfirmModal from '@components/ConfirmModal';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import * as Illustrations from '@components/Icon/Illustrations';
import ScreenWrapper from '@components/ScreenWrapper';
import UserListItem from '@components/SelectionList/UserListItem';
import type {SelectorType} from '@components/SelectionScreen';
import SelectionScreen from '@components/SelectionScreen';
import useLocalize from '@hooks/useLocalize';
import * as ReportActions from '@libs/actions/Report';
import Navigation from '@libs/Navigation/Navigation';
import type {ReportDetailsNavigatorParamList} from '@libs/Navigation/types';
import * as ReportUtils from '@libs/ReportUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';

type ReportDetailsExportPageProps = StackScreenProps<ReportDetailsNavigatorParamList, typeof SCREENS.REPORT_DETAILS.EXPORT>;

type ModalStatus = ValueOf<typeof CONST.REPORT.EXPORT_OPTIONS> | null;

function ReportDetailsExportPage({route}: ReportDetailsExportPageProps) {
    const reportID = route.params.reportID;
    const [report] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${reportID}`);
    const policyID = report?.policyID;
    const {translate} = useLocalize();
    const [modalStatus, setModalStatus] = useState<ModalStatus>(null);
    const connectionName = route?.params?.connectionName;
    const iconToDisplay = ReportUtils.getIntegrationIcon(connectionName);
    const canBeExported = ReportUtils.canBeExported(report);

    const exportSelectorOptions: SelectorType[] = useMemo(
        () => [
            {
                value: CONST.REPORT.EXPORT_OPTIONS.EXPORT_TO_INTEGRATION,
                text: translate('workspace.common.exportIntegrationSelected', connectionName),
                icons: [
                    {
                        source: iconToDisplay ?? '',
                        type: 'avatar',
                    },
                ],
                isDisabled: !canBeExported,
                onPress: () => {
                    if (ReportUtils.isExported(report)) {
                        setModalStatus(CONST.REPORT.EXPORT_OPTIONS.EXPORT_TO_INTEGRATION);
                    } else {
                        ReportActions.exportToIntegration(reportID, connectionName);
                    }
                },
            },
            {
                value: CONST.REPORT.EXPORT_OPTIONS.MARK_AS_EXPORTED,
                text: translate('workspace.common.markAsExported'),
                icons: [
                    {
                        source: iconToDisplay ?? '',
                        type: 'avatar',
                    },
                ],
                isDisabled: !canBeExported,
                onPress: () => {
                    if (ReportUtils.isExported(report)) {
                        setModalStatus(CONST.REPORT.EXPORT_OPTIONS.MARK_AS_EXPORTED);
                    } else {
                        ReportActions.markAsManuallyExported(reportID);
                    }
                },
            },
        ],
        [iconToDisplay, canBeExported, translate, report, reportID, connectionName],
    );

    const confirmExport = useCallback(() => {
        if (modalStatus === CONST.REPORT.EXPORT_OPTIONS.EXPORT_TO_INTEGRATION) {
            ReportActions.exportToIntegration(reportID, connectionName);
        } else if (modalStatus === CONST.REPORT.EXPORT_OPTIONS.MARK_AS_EXPORTED) {
            ReportActions.markAsManuallyExported(reportID);
        }
        setModalStatus(null);
    }, [connectionName, modalStatus, reportID]);

    if (!canBeExported) {
        return (
            <ScreenWrapper testID={ReportDetailsExportPage.displayName}>
                <HeaderWithBackButton title={translate('common.export')} />
                <ConfirmationPage
                    illustration={Illustrations.LaptopwithSecondScreenandHourglass}
                    heading={translate('workspace.export.notReadyHeading')}
                    description={translate('workspace.export.notReadyDescription')}
                    shouldShowButton
                    buttonText={translate('common.buttonConfirm')}
                    onButtonPress={Navigation.goBack}
                    illustrationStyle={{width: 233, height: 162}}
                />
            </ScreenWrapper>
        );
    }

    return (
        <>
            <SelectionScreen
                policyID={policyID ?? ''}
                accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN, CONST.POLICY.ACCESS_VARIANTS.PAID]}
                featureName={CONST.POLICY.MORE_FEATURES.ARE_CONNECTIONS_ENABLED}
                displayName={ReportDetailsExportPage.displayName}
                sections={[{data: exportSelectorOptions}]}
                listItem={UserListItem}
                shouldBeBlocked={false}
                onBackButtonPress={() => Navigation.goBack(ROUTES.REPORT_WITH_ID_DETAILS.getRoute(reportID))}
                title="common.export"
                connectionName={connectionName}
                onSelectRow={(option) => {
                    option.onPress?.();
                }}
            />
            {!!modalStatus && (
                <ConfirmModal
                    title={translate('workspace.exportAgainModal.title')}
                    onConfirm={confirmExport}
                    onCancel={() => setModalStatus(null)}
                    prompt={translate('workspace.exportAgainModal.description', report?.reportName ?? '', connectionName)}
                    confirmText={translate('workspace.exportAgainModal.confirmText')}
                    cancelText={translate('workspace.exportAgainModal.cancelText')}
                    isVisible
                />
            )}
        </>
    );
}

ReportDetailsExportPage.displayName = 'ReportDetailsExportPage';

export default ReportDetailsExportPage;
export type {ModalStatus};
