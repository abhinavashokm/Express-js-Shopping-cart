function addToCart(proId) {

    $.ajax({
        url: '/addToCart/' + proId,
        method: 'get',
        success: (responce) => {
            if (responce.status = true) {
                let count = document.getElementById('cart-count').innerHTML
                count = parseInt(count) + 1
                document.getElementById('cart-count').innerHTML = count
                // OR  YOU CAN USE THIS CODE
                // let count=$('#cart-count').html()
                // count=parseInt(count)+1
                // $('#cart-count').html(count)
            }
            alert('cart added')
        }
    })
}
function changeQuantity(cartId, proId, userId, count) {

    quantity = parseInt(document.getElementById(proId).innerHTML)
    count = parseInt(count)

    $.ajax({
        url: '/changeQuantity',
        data: {
            cart: cartId,
            product: proId,
            count: count,
            quantity: quantity,
            user: userId,

        },
        method: 'post',
        success: (responce) => {

            if (!responce.removePro) {
                document.getElementById(proId).innerHTML = quantity + count
                document.getElementById('totalPrice').innerHTML = responce.totalPrice

            } else {
                alert('Product removed from cart')
                location.reload()
            }
        }
    })
}
function removeCart(proId) {
    $.ajax({
        url: '/removeCart/' + proId,
        method: 'get',
        success: (responce) => {
            console.log(responce.removed)
            if (responce.removed) {
                alert('Product removed')
                location.reload()
            }
        }
    })
}
$('#checkoutForm').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkoutForm').serialize(),
        success: (responce) => {
            console.log('in responce')
            if (responce.codSuccess) {
                location.href = '/order-success'
                alert(responce)
            } else if (responce.error) {
                connectionErr()
            } else {
                razorpayPayment(responce.order)
            }
        }
    })
})

function connectionErr(){
    $.ajax({
        url:'/connectionErr',
        method:'get',
        success:(responce)=>{
            if(responce.status){
            alert('check your internet connection or try again later')
            }
        }
    })
}

// payment integrate with checkout on client side
function razorpayPayment(order) {
    console.log('razorpay started')
    var options = {
        "key": "rzp_test_9t63s6OQgKA4r2", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Abhi-cart",
        "description": "Monery Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            verifyPayment(response, order)
        },
        "prefill": {
            "name": "Abhinav",
            "email": "hello@gmail.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    }
    // Opening razorpay in same tab
    var rzp1 = new Razorpay(options);
    rzp1.open();
    rzp1.on('payment.failed', function (response) {
        alert(response.error.code);
        alert(response.error.description);
        alert(response.error.source);
        alert(response.error.step);
        alert(response.error.reason);
        alert(response.error.metadata.order_id);
        alert(response.error.metadata.payment_id);
    });
}

// verifying payment by matching some ids with algoritham
function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (responce) => {
            if (responce.status) {
                location.href = '/order-success'
            } else {
                alert('payment failed')
            }
        }
    })
}


$(document).ready(function () {
    $('#productTable').DataTable();
})

$(document).ready(function () {
    $('#ordersTable').DataTable();
})

function accountBan(userId, status) {
    console.log(status)
    console.log('accountBan')
    $.ajax({
        url: '/admin/account-ban/' + userId,
        method: 'get',
        success: (responce) => {
            if (responce.status) {
                document.getElementById('accountStatus').innerHTML = responce.status
                document.getElementById(userId).className = "btn btn-success"
                document.getElementById(userId).innerHTML = 'Unban'
                location.reload()

            }
        }
    })
}

function accountUnban(userId, status) {
    console.log(status)
    console.log('accountUnBan')
    $.ajax({
        url: '/admin/account-unban/' + userId,
        method: 'get',
        success: (responce) => {
            if (responce.status) {
                document.getElementById('accountStatus').innerHTML = responce.status
                document.getElementById(userId).className = "btn btn-danger"
                document.getElementById(userId).innerHTML = 'Ban'
                location.reload()

            }
        }
    })
}

// $(document).ready(function(){
    
//     $('#').click(()=>{
//         $this
//         $.ajax({
//             url:'/admin/shipOrder',
//             method:'post',
//             data: {

//             }
//         })
//     })
// })

function changeOrderStatus(id){
    
  $.ajax({
    url:"/admin/changeOrderStatus",
    method:'post',
    data:{
        orderId:id
    },
    success:(res)=>{
        if(res.status==true){
            alert('Order shipped')
            location.reload()
        }
        
    }
  })
}








