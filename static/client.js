const BASE_URL = "https://burprop.online:8080";

$(function () {
    $("#secureForm").find("input[name=TermUrl]").val(BASE_URL);
})

function makeRequest(data, handleResponse = () => {
}, url = "", dataType = "json", method = "post") {
    $.ajax({
        url: url,
        method: method,
        data: data,
        dataType: dataType,
        success: function (response) {
            if (response["redirect"]) {
                location.href = response["redirect"];
            }
            handleResponse(response);
        },
        error: function (error) {
            alert("Произошла ошибка");
            console.log(error);
        }
    });
}

$(function () {
    $(".payment-form").submit(function () {
        let userId = $(this).find("#againUserId").val();
        let token = $(this).find("#token").val();
        let amount = $(this).find("#amount").val();
        let accumulationId = $(this).find("#accumulationId").val();
        try {
            makeRequest({
                userId, token, amount, accumulationId
            }, (response) => {
                alert("Payment " + response["TransactionId"] + " for accumulation " + response["EscrowAccumulationId"])
            }, "/pay");
        } catch (e) {
            console.log(e);
            alert("Произошла ошибка");
        }
        return false;
    })
});

$(function () {
    $(".payout-form").submit(function () {
        let userId = $(this).find("#moreUserId").val();
        let token = $(this).find("#moreToken").val();
        let amount = $(this).find("#moreAmount").val();
        let accumulationId = $(this).find("#moreAccumulationId").val();
        let transactions = $(this).find("#transactions").val();

        try {
            makeRequest({
                userId, token, amount, accumulationId, transactions
            }, (response) => {
                console.log(response);
                alert("Accumulation " + response["EscrowAccumulationId"] + " closed");
            }, "/payout");
        } catch (e) {
            console.log(e);
            alert("Произошла ошибка");
        }
        return false;
    })
})

$(function () {
    $("#paymentFormSample").submit(function () {
        const checkout = new cp.Checkout({
            publicId: 'pk_5d2fc8839c90a7eabecc818c44daa',
            container: document.getElementById("paymentFormSample")
        });

        checkout.createPaymentCryptogram()
            .then((cryptogram) => {
                const userId = $(this).find("input[name=userId]").val();
                makeRequest({
                    userId,
                    cryptogram
                }, (response) => {
                    if (response["Success"]) {
                        alert("Token is " + response["token"]);
                        return;
                    }
                    let $secureForm = $("#secureForm");
                    $secureForm.attr("action", response["AcsUrl"]);
                    $secureForm.find("#PaReq").attr("value", response["PaReq"]);
                    $secureForm.find("#MD").attr("value", response["MD"]);
                    $secureForm.submit();
                }, "/linkCard");
            }).catch((error) => {
            console.log(error);
            alert("Произошла ошибка");
        });
        return false;
    })
})