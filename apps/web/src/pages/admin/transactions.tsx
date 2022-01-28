import { FirebaseClaim, Payment, PaymentList } from '@algomart/schemas'
import { RefreshIcon } from '@heroicons/react/outline'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import Pagination from '@/components/pagination/pagination'
import Panel from '@/components/panel'
import Table from '@/components/table'
import { ColumnDefinitionType } from '@/components/table'
import { useAuth } from '@/contexts/auth-context'
import usePagination from '@/hooks/use-pagination'
import DefaultLayout from '@/layouts/default-layout'
import adminService from '@/services/admin-service'
import { isAuthenticatedUserAdmin } from '@/services/api/auth-service'
import { getPaymentsFilterQuery } from '@/utils/filters'
import { useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

const PAYMENTS_PER_PAGE = 10

export default function AdminTransactionsPage() {
  const auth = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    const findUser = async () => {
      try {
        const { claims } = await adminService.getLoggedInUserPermissions()
        // If there is no admin role, throw error
        if (!claims || !claims.includes(FirebaseClaim.admin)) {
          throw new Error('User is not admin')
        }
      } catch (error) {
        console.error(error)
        router.push(urls.home)
      }
    }
    // Check permissions on page render, after auth token is refreshed so claims are fresh
    if (auth.user) {
      findUser()
    }
  }, [auth?.user, router])

  const { page, setPage, handleTableHeaderClick, sortBy, sortDirection } =
    usePagination(1, 'createdAt', 'desc')

  const qp = getPaymentsFilterQuery({
    page,
    sortBy,
    sortDirection: sortDirection as any,
    pageSize: PAYMENTS_PER_PAGE,
  })
  const { data: tableData, isValidating } = useAuthApi<PaymentList>(
    `${urls.api.v1.admin.getPayments}?${qp}`
  )

  const columns: ColumnDefinitionType<Payment, keyof Payment>[] = tableData
    ?.payments[0]
    ? Object.keys(tableData.payments[0]).map((key) => ({ key, name: key }))
    : []

  const footer = (
    <>
      <Pagination
        className="block"
        currentPage={page}
        total={tableData?.total || 0}
        pageSize={PAYMENTS_PER_PAGE}
        setPage={setPage}
      />
      {tableData?.total > 0 && <div>{tableData.total} records found</div>}
    </>
  )

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Transactions')}
      noPanel
      width="full"
    >
      <Panel
        fullWidth
        title="Transactions"
        contentRight={
          isValidating && <RefreshIcon className="w-5 h-5 animate-spin" />
        }
        footer={footer}
      >
        <div className="overflow-x-auto">
          <Table<Payment, keyof Payment>
            columns={columns}
            data={tableData?.payments}
            onHeaderClick={handleTableHeaderClick}
            sortBy={sortBy}
            sortDirection={sortDirection as any}
          />
        </div>
      </Panel>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Check if the user is admin (check again on render, to prevent caching of claims)
  const user = await isAuthenticatedUserAdmin(context)
  if (!user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
