import { useCallback, useEffect, useState } from 'react';
import { UserProvider } from '../UserContext';
import Menu from '../Menu';
import InvestForm from '../InvestForm';
import Filters from '../Filters';
import InvestsTable from '../InvestsTable';
import styles from './index.module.css';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { InvestFilter, getInvests, Invest } from '@/db/DbInvests.ts';

const App = () => {
    const [activeFilter, setActiveFilter] = useState(false);
    const [showPayed, setShowPayed] = useState(false);
    const [invests, setInvests] = useState<Invest[]>([]);

    const fetchInvests = useCallback(async () => {
        const filter : InvestFilter = {filterOnlyActive: activeFilter ? 0 : 1};

        const invests = await getInvests(filter);

        const sortedInvests = invests.sort((a, b) => {
            const dayA = a.createdDate.getDate();
            const dayB = b.createdDate.getDate();
            return dayA - dayB;
        });
        setInvests(sortedInvests);

    }, [activeFilter]);

    useEffect(() => {
        fetchInvests().catch((error) => {
            console.error("Ошибка в fetchInvests:", error);
        });
    }, [fetchInvests]);

    return (
        <UserProvider>
            <ToastContainer
                position="top-center"
                closeButton={false}
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                transition={Slide}
                theme="dark"
            />

            <div className={styles.container}>
                <h1>Инвестиции</h1>

                <Menu onUpdate={fetchInvests} />
                <InvestForm onAddInvest={fetchInvests} />
                <Filters
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    showPayed={showPayed}
                    setShowPayed={setShowPayed}
                />
                <InvestsTable
                    invests={invests}
                    onCloseInvest={fetchInvests}
                    showPayed={showPayed}
                />
            </div>
        </UserProvider>
    );
};

export default App;
