

$(function () {
    $("#paymentFormSample").submit(function () {
        const checkout = new cp.Checkout({
            publicId: 'test_api_000000000000000002',
            container: document.getElementById("paymentFormSample")
        });

        checkout.createPaymentCryptogram()
            .then((cryptogram) => {
                console.log(cryptogram); // криптограмма

            }).catch((errors) => {
            console.log(errors);
            alert("Произошла ошибка");
        });
        return false;
    })
})