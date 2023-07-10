'use client';
import Container from "@/app/components/Container";
import { categories } from "@/app/components/navbar/Categories";
import { SafeListings, SafeUser } from "@/app/types";
import { Reservation } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ListingHead from "../../components/listings/ListingHead";
import ListingInfo from "../../components/listings/ListingInfo";
import { useRouter } from "next/navigation";
import useLoginModel from "@/app/hooks/useLoginModel";
import { differenceInCalendarDays, eachDayOfInterval } from "date-fns";
import axios from "axios";
import { toast } from "react-hot-toast";
const initialDateRange = {
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection'
}
interface ListingClientProps {
    reservation?: Reservation[];
    listing: SafeListings & {
        user:SafeUser
    };
    currentUser: SafeUser | null;

}
const ListingClient:React.FC<ListingClientProps> = ({
    listing,
    reservation = [],
    currentUser,
}) => {
    const loginModel = useLoginModel();
    const router = useRouter();
    const disabledDates = useMemo(()=>{
         let dates : Date[] = [];
            reservation.forEach((reservation)=>{
                const range = eachDayOfInterval({
                    start: new Date(reservation.startDate),
                    end: new Date(reservation.endDate)
                });
                dates = [...dates, ...range];
            })
            return dates;
    },[reservation]);

    const [isLoading,setIsLoading] = useState(false);
    const [totalPrice, setTotalPrice] = useState(listing.price);
    const [dateRange, setDateRange] = useState(initialDateRange);

    const onCreateReservation = useCallback(()=>{
        if(!currentUser){
            return loginModel.onOpen();
        }
        setIsLoading(true);
        axios.post('/api/reservations',{
            totalPrice,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            listingId: listing?.id
        })
        .then(()=>{
            toast.success('Reservation created');
            setDateRange(initialDateRange);
            router.refresh();
        })
        .catch(()=>{
            toast.error('Something went wrong');
        })
        .finally(()=>{
            setIsLoading(false);
        })
    },[
        currentUser,
        listing?.id,
        totalPrice,
        dateRange,
        router,
        loginModel
    ]);

    useEffect(()=>{
        if(dateRange.startDate && dateRange.endDate){
           const dayCount = differenceInCalendarDays(
            dateRange.endDate, 
            dateRange.startDate
            );
            if(dayCount && listing.price){
                setTotalPrice(dayCount * listing.price);
            }else{
                setTotalPrice(listing.price);
            }
        }
    },[dateRange, listing.price])

    const category = useMemo(()=>{
        return categories.find((item)=>item.label === listing.category);
    },[listing.category]);
 
    return ( 
    <Container>
        <div className="max-w-screen-lg mx-auto">
            <div className="flex flex-col gap-6">
                <ListingHead
                title={listing.title}
                imageSrc={listing.imageSrc}
                locationValue={listing.locationValue}
                id={listing.id}
                currentUser={currentUser}
                />
                <div className="
                grid
                grid-cols-1
                md:grid-cols-7
                md:gap-10
                mt-6
                ">
                    <ListingInfo
                    user={listing.user}
                    category={category}
                    description={listing.description}
                    guestCount = {listing.guestCount}
                    roomCount={listing.roomCount}
                    bathRoomCount={listing.bathRoomCount}
                    locationValue={listing.locationValue}
                    />
                    <div className="
                    order-first
                    mb-10
                    md:order-last
                    md-col-span-3
                    ">
                        
                    </div>
                </div>
            </div>
        </div>
    </Container>
    );
}
 
export default ListingClient;